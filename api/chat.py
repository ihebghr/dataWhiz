import os
import json
from http.server import BaseHTTPRequestHandler
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# Configuration
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
GROQ_MODEL = "llama-3.3-70b-versatile"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        request_body = json.loads(post_data.decode('utf-8'))

        question = request_body.get('question')
        data = request_body.get('context', []) # This is the data array
        profile = request_body.get('profile', {})

        if not question:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No question provided"}).encode())
            return

        try:
            # 1. Prepare Documents from CSV Data
            # We convert each row into a string representation for the RAG
            documents = []
            for i, row in enumerate(data):
                content = " | ".join([f"{k}: {v}" for k, v in row.items()])
                doc = Document(page_content=content, metadata={"row": i, "source": "uploaded_file"})
                documents.append(doc)

            # 2. Split Documents (though rows are already like chunks)
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=CHUNK_SIZE,
                chunk_overlap=CHUNK_OVERLAP
            )
            chunks = splitter.split_documents(documents)

            # 3. Create Vector Store
            embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
            vectorstore = FAISS.from_documents(chunks, embeddings)
            retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

            # 4. Build Prompt
            template = """You are DataWhiz AI, a sophisticated data analyst assistant. 
            Use the following context (data rows and summary) to answer the user's question.
            
            If the information is not in the context, say you don't know.
            Keep the response structured and professional.

            CONTEXT:
            {context}

            QUESTION:
            {question}

            ANSWER:"""
            prompt = PromptTemplate.from_template(template)

            # 5. Get Answer
            llm = ChatGroq(
                model=GROQ_MODEL,
                temperature=0.1,
                api_key=os.getenv("GROQ_API_KEY")
            )

            relevant_docs = retriever.invoke(question)
            context_str = "\n".join([d.page_content for d in relevant_docs])
            
            # Include profile summary in context if available
            if profile:
                context_str = f"Data Profile Summary: {json.dumps(profile)}\n\nRelevant Rows:\n" + context_str

            final_prompt = prompt.format(context=context_str, question=question)
            response = llm.invoke(final_prompt).content

            # Send Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"response": response}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            return
