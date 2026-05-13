import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// User Operations
export async function syncUser(user: any) {
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

// Project Operations
export async function createProject(name: string, rowsCount: number, colsCount: number, size: number) {
  if (!auth.currentUser) throw new Error("Authentication required");
  
  const projectRef = doc(collection(db, 'projects'));
  const projectData = {
    name,
    rowsCount,
    colsCount,
    size,
    ownerId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(projectRef, projectData);
    return projectRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectRef.id}`);
    throw error;
  }
}

export async function saveRows(projectId: string, rows: any[]) {
  const batch = writeBatch(db);
  rows.forEach((rowData, index) => {
    const rowRef = doc(collection(db, `projects/${projectId}/rows`));
    batch.set(rowRef, { data: rowData, index });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}/rows`);
  }
}

export async function addHistoryEntry(projectId: string, action: any) {
  const historyRef = collection(db, `projects/${projectId}/history`);
  try {
    await addDoc(historyRef, {
      ...action,
      timestamp: Date.now() // The schema uses number for timestamp in the blueprint for ActionLog
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}/history`);
  }
}

export async function getUserProjects() {
  if (!auth.currentUser) return [];
  const projectsRef = collection(db, 'projects');
  const q = query(projectsRef, where('ownerId', '==', auth.currentUser.uid), orderBy('updatedAt', 'desc'));
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'projects');
    return [];
  }
}

export async function getProjectData(projectId: string) {
  const rowsRef = collection(db, `projects/${projectId}/rows`);
  const q = query(rowsRef, orderBy('index', 'asc'));
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().data);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `projects/${projectId}/rows`);
    return [];
  }
}

export async function getProjectHistory(projectId: string) {
  const historyRef = collection(db, `projects/${projectId}/history`);
  const q = query(historyRef, orderBy('timestamp', 'desc'));
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `projects/${projectId}/history`);
    return [];
  }
}
