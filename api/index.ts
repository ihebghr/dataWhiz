import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import express from "express";
import path from "path";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import fs from "fs";
import Groq from "groq-sdk";
import os from "os";

const app = express();

/**
 * Middleware Configuration
 * - Increase body limits to handle large datasets (up to 50MB)
 */
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));

/**
 * File Upload Configuration (Multer)
 * - Vercel compatibility: Uses os.tmpdir() for temporary storage
 * - Limit file size to 50MB
 */
const upload = multer({ 
  dest: os.tmpdir(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// --- API Routes ---

/**
 * POST /api/upload
 * Handles file uploads (CSV, Excel, JSON), parses them, and returns a data preview.
 */
app.post("/api/upload", upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const extension = path.extname(fileName).toLowerCase();

  try {
    let data : any[] = [];
    
    // Parse CSV files
    if (extension === '.csv') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const results = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      data = results.data;
    } 
    // Parse Excel files (.xlsx, .xls)
    else if (extension === '.xlsx' || extension === '.xls') {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
         throw new Error("Excel file has no sheets");
      }
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } 
    // Parse JSON files
    else if (extension === '.json') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
    } 
    else {
      console.error(`Unsupported extension: ${extension}`);
      return res.status(400).json({ error: "Unsupported file format" });
    }

    // Clean up temporary file immediately after parsing
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Return file metadata and preview
    res.json({
      fileName,
      size: req.file.size,
      rows: data.length,
      columns: data.length > 0 ? Object.keys(data[0]).length : 0,
      preview: data.slice(0, 50), // Send first 50 rows for initial view
      fullData: data
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    // Ensure cleanup even on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: `Failed to process file: ${error.message}` });
  }
});

/**
 * POST /api/profile
 * Analyzes the provided dataset and returns statistical profiling for each column.
 * - Detects data types (number, datetime, boolean, string)
 * - Calculates missing values, unique counts, and basic stats (mean, median, etc.)
 */
app.post("/api/profile", (req, res) => {
  const { data } = req.body;
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const columns = Object.keys(data[0] || {});
  const profile: any = {};

  columns.forEach(col => {
    // Filter out null/undefined/empty values for stats
    const values = data.map(row => row[col]).filter(v => v !== undefined && v !== null && v !== '');
    const allValues = data.map(row => row[col]);
    const missingCount = allValues.length - values.length;
    
    // Simple Type Detection
    let type = 'string';
    if (values.length > 0) {
      const firstVal = values[0];
      if (typeof firstVal === 'number') type = 'number';
      else if (!isNaN(Date.parse(firstVal as any)) && isNaN(Number(firstVal))) type = 'datetime';
      else if (typeof firstVal === 'boolean') type = 'boolean';
    }

    const uniqueValues = new Set(values).size;
    
    const stats: any = {
      type,
      missingCount,
      missingPercentage: ((missingCount / allValues.length) * 100).toFixed(2),
      uniqueCount: uniqueValues,
    };

    // Calculate Numerical Stats
    if (type === 'number') {
      const nums = values.map(v => Number(v)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        stats.min = nums[0];
        stats.max = nums[nums.length - 1];
        stats.mean = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        stats.median = nums[Math.floor(nums.length / 2)];
      }
    } 
    // Calculate Categorical Frequency
    else {
      const freq : any = {};
      values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      stats.topValues = Object.entries(freq).sort((a:any, b:any) => b[1] - a[1]).slice(0, 5);
    }

    profile[col] = stats;
  });

  res.json(profile);
});

/**
 * POST /api/ai/generate
 * Main endpoint for "Quick Clean" functionality.
 * Generates a cleaning plan (JSON) based on a system prompt and dataset summary.
 */
app.post("/api/ai/generate", async (req, res) => {
  const { prompt, model = "llama-3.1-8b-instant" } = req.body;

  try {
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey });
      
      // Use a fast model for better Vercel compatibility (avoiding 10s timeout)
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are a data cleaning assistant. Always return valid JSON objects." 
          },
          { role: "user", content: prompt }
        ],
        model: model,
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for deterministic output
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("AI returned an empty response");
      }

      return res.json({ text: content });
    } else {
      console.error("GROQ_API_KEY is missing from environment variables");
      return res.status(401).json({ 
        error: "Groq API key is missing. Please add GROQ_API_KEY to your Vercel Environment Variables." 
      });
    }
  } catch (error: any) {
    console.error("AI Generation error:", error);
    res.status(500).json({ 
      error: "AI generation failed", 
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/chat
 * Dual-purpose Chat endpoint:
 * 1. Handles general questions about the data (Analysis Mode).
 * 2. Processes natural language cleaning instructions (Instruction Mode).
 */
app.post("/api/ai/chat", async (req, res) => {
  const { question, context, profile, isCleaningRequest = false } = req.body;

  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(401).json({ error: "Groq API key is missing." });
    }

    const groq = new Groq({ apiKey: groqKey });
    
    let systemPrompt = "";
    
    // Scenario A: User wants to CLEAN the data via chat
    if (isCleaningRequest) {
      systemPrompt = `You are a Data Engineering Expert. The user wants to perform specific cleaning or transformation actions on their dataset.
      
      DATASET PROFILE:
      ${JSON.stringify(profile)}
      
      INSTRUCTIONS:
      1. Analyze the user's request and map it to one or more of these AVAILABLE ACTIONS:
         - ENCODING_FIX: Repair characters.
         - SMART_FIX: Normalize separators/types.
         - CAST_TYPE: Convert to int/date/float.
         - IMPUTE: Fill nulls (mean/median/mode).
         - FILL_SENTINEL: Fill nulls with "UNKNOWN" or 0.
         - STANDARDIZE: Trim and lowercase strings.
         - REMOVE_DUPLICATES: Remove exact duplicate rows.
         - DROP_MISSING: Remove rows with missing values (use sparingly).
      
      2. If the request is a cleaning instruction, your response MUST be a valid JSON object with an "actions" array.
      3. Each action must include: "order", "type", "column" (or "all"), "action" (description), and "reason".
      
      FORMAT:
      {
        "isAction": true,
        "message": "I will apply these changes for you...",
        "actions": [
          { "order": 1, "type": "ACTION_TYPE", "column": "col_name", "action": "description", "reason": "why" }
        ]
      }`;
    } 
    // Scenario B: User wants to ANALYZE the data via chat
    else {
      systemPrompt = `You are DataWhiz AI, a sophisticated data analyst assistant. 
      You help users understand their datasets by providing insights, summaries, and answering questions.
      
      DATASET PROFILE SUMMARY:
      ${JSON.stringify(profile)}
      
      DATASET SAMPLE:
      ${JSON.stringify(context)}
      
      INSTRUCTIONS:
      1. If the user's message looks like a cleaning instruction (e.g., "clean", "fix", "uppercase", "remove"), set "isAction" to true and ask them to confirm if they want you to generate a cleaning plan.
      2. Otherwise, answer their question normally.
      3. Your response must be a JSON object with "message" and "isAction" (boolean).
      
      FORMAT:
      {
        "isAction": false,
        "message": "Your answer in Markdown here..."
      }`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return res.json(content);
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request", details: error.message });
  }
});

export default app;
