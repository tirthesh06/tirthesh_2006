import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Student, LearningPath, PerformancePrediction, ProgressInsight, SubjectProgress, ActivitySuggestion } from '../types';

// FIX: Initialize Gemini AI Client. Ensure API_KEY is set in your environment variables.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

// A simple in-memory cache to store chat histories
const chatHistories = new Map<string, any>();

export const getChatbotResponse = async (
  prompt: string,
  history: ChatMessage[],
  context: string,
  lang: string // e.g., 'en-IN', 'hi-IN', 'mr-IN'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Create a unique key based on context and language
    const historyKey = `chat-session-${lang}-${context.substring(0, 20)}`;

    let chat = chatHistories.get(historyKey);
    
    const languageName = {
        'en-IN': 'English (Indian accent)',
        'hi-IN': 'Hindi',
        'mr-IN': 'Marathi'
    }[lang] || 'English';

    if (!chat) {
        // Create a new chat session with system instructions
        chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: `You are a helpful AI assistant for a smart education platform. Your primary role is to assist students, teachers, and parents.
                --- IMPORTANT INSTRUCTION ---
                You MUST reply in the ${languageName} language.
                Current context: ${context}.
                Base your answers on this context whenever relevant.
                Keep your responses concise and helpful.
                If you don't know the answer, say that you don't have enough information.`,
            },
            history: history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        });
        chatHistories.set(historyKey, chat);
    }

    const result = await chat.sendMessage({ message: prompt });
    
    // FIX: Correctly access the generated text from the response.
    const responseText = result.text;
    
    if (!responseText) {
        return "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return responseText;
  } catch (error) {
    console.error("Error getting response from Gemini API:", error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};

export const generatePersonalizedLearningPath = async (student: Student): Promise<LearningPath | null> => {
  try {
    const model = 'gemini-2.5-flash';

    // 1. Analyze student data to find weakest and strongest subjects
    const subjectStats: { [subject: string]: { present: number, total: number } } = {};
    student.attendance.forEach(record => {
        if (!subjectStats[record.subject]) {
            subjectStats[record.subject] = { present: 0, total: 0 };
        }
        if (record.status === 'Present') {
            subjectStats[record.subject].present++;
        }
        subjectStats[record.subject].total++;
    });

    let weakestSubject = 'General Studies';
    let strongestSubject = 'General Studies';
    let minPercentage = 101;
    let maxPercentage = -1;

    for (const subject in subjectStats) {
        const percentage = (subjectStats[subject].present / subjectStats[subject].total) * 100;
        if (percentage < minPercentage) {
            minPercentage = percentage;
            weakestSubject = subject;
        }
        if (percentage > maxPercentage) {
            maxPercentage = percentage;
            strongestSubject = subject;
        }
    }

    const totalAttendance = student.attendance.length;
    const presentCount = student.attendance.filter(a => a.status === 'Present').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

    const inputData = {
        student_id: student.id,
        attendance_percentage: attendancePercentage.toFixed(1),
        subject_performance: Object.keys(subjectStats).map(subject => ({
            subject: subject,
            score: `${((subjectStats[subject].present / subjectStats[subject].total) * 100).toFixed(1)}% attendance`
        })),
        weakest_subject: weakestSubject,
        strongest_subject: strongestSubject,
    };

    // 2. Construct the prompt for the AI
    const prompt = `You are an expert AI educational planner. Your task is to generate a structured, personalized weekly learning path for a student based on their academic data below.
The plan should prioritize the student's weakest subject while also including one activity for their strongest subject to build confidence. The tone should be encouraging and supportive.
The output must be a clean, valid JSON object, adhering to the provided schema.

---
Student's Academic Data (based on attendance):
- Student ID: ${inputData.student_id}
- Overall Attendance: ${inputData.attendance_percentage}%
- Strongest Subject (by attendance): ${inputData.strongest_subject}
- Weakest Subject (by attendance): ${inputData.weakest_subject}
- Subject Performance Details:
${inputData.subject_performance.map(s => `  - ${s.subject}: ${s.score}`).join('\n')}
---
`;

    // 3. Define the response schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        overall_summary: { type: Type.STRING, description: "A brief, encouraging summary for the student." },
        daily_plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              focus_topic: { type: Type.STRING },
              learning_activity: { type: Type.STRING },
              practice_task: { type: Type.STRING },
              estimated_time: { type: Type.STRING },
            },
            required: ["day", "focus_topic", "learning_activity", "practice_task", "estimated_time"]
          }
        }
      },
      required: ["overall_summary", "daily_plan"]
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as LearningPath;

  } catch (error) {
    console.error("Error generating personalized learning path:", error);
    return null;
  }
};

export const generateStudentInitiatedLearningPath = async (
  formData: { subjects: string; examDates: string; studyHours: string; strengthsWeaknesses: string; goal: string },
  studentName: string
): Promise<LearningPath | null> => {
  try {
    const model = 'gemini-2.5-flash';

    const prompt = `
You are a friendly and intelligent "Study Partner AI" for a student named ${studentName}.
Your tone must be helpful, motivational, and supportive, not robotic. Use emojis to make the interaction engaging.

Based on the student's information below, generate a detailed and structured 7-day learning plan.

---
**Student's Information:**
- **Subjects:** ${formData.subjects}
- **Exam Dates:** ${formData.examDates}
- **Daily Study Hours:** ${formData.studyHours}
- **Strengths & Weaknesses:** ${formData.strengthsWeaknesses}
- **Goal:** ${formData.goal}
---

**Instructions for Plan Generation:**
1.  **Overall Summary:** Start with a brief, encouraging summary for the student. Example: "Hey ${studentName}! 👋 Here is your personalized study plan..."
2.  **Structure:** Provide a day-wise breakdown for a full 7-day week (e.g., Monday to Sunday).
3.  **Daily Tasks:** For each day, provide:
    -   \`focus_topic\`: The main topic to study for that day.
    -   \`learning_activity\`: A clear, actionable learning task. Example: "Read Chapter 3 and watch a concept video on [topic]."
    -   \`practice_task\`: A specific practice exercise. Example: "Solve 15 practice questions from the textbook."
    -   \`estimated_time\`: A realistic time estimate for the tasks. Example: "2-3 hours".
4.  **Weekend Plan:** The plan for Saturday and Sunday should focus on revision, practice tests, or catching up on weaker topics.
5.  **Output Format:** The output must be a clean, valid JSON object that strictly adheres to the provided schema.

This plan should be realistic, actionable, and tailored to help ${studentName} achieve their goal of "${formData.goal}".
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        overall_summary: { type: Type.STRING, description: "A brief, encouraging summary for the student." },
        daily_plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              focus_topic: { type: Type.STRING },
              learning_activity: { type: Type.STRING },
              practice_task: { type: Type.STRING },
              estimated_time: { type: Type.STRING },
            },
            required: ["day", "focus_topic", "learning_activity", "practice_task", "estimated_time"]
          }
        }
      },
      required: ["overall_summary", "daily_plan"]
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as LearningPath;

  } catch (error) {
    console.error("Error generating student-initiated learning path:", error);
    return null;
  }
};

export const predictStudentPerformance = async (student: Student): Promise<PerformancePrediction | null> => {
  try {
    const model = 'gemini-2.5-flash';

    // 1. Analyze student data
    const totalAttendance = student.attendance.length;
    const presentCount = student.attendance.filter(a => a.status === 'Present').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

    const subjectStats: { [subject: string]: { present: number, total: number } } = {};
    student.attendance.forEach(record => {
        if (!subjectStats[record.subject]) {
            subjectStats[record.subject] = { present: 0, total: 0 };
        }
        if (record.status === 'Present') {
            subjectStats[record.subject].present++;
        }
        subjectStats[record.subject].total++;
    });

    let weakestSubject = 'N/A';
    let strongestSubject = 'N/A';
    if (Object.keys(subjectStats).length > 0) {
        let minPercentage = 101;
        let maxPercentage = -1;
        for (const subject in subjectStats) {
            const percentage = (subjectStats[subject].present / subjectStats[subject].total) * 100;
            if (percentage < minPercentage) {
                minPercentage = percentage;
                weakestSubject = subject;
            }
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                strongestSubject = subject;
            }
        }
    }

    const learningPathSummary = student.learningPath 
      ? `The student has an active learning plan: "${student.learningPath.overall_summary}"`
      : "The student does not currently have an AI-generated learning plan.";

    // 2. Construct the prompt for the AI
    const prompt = `
You are an expert AI academic advisor. Your task is to analyze the student's academic data below to predict their performance in upcoming final exams.
Your tone should be analytical but encouraging.

---
**Student's Academic Data:**
- **Name:** ${student.name}
- **Overall Attendance:** ${attendancePercentage.toFixed(1)}%
- **Strongest Subject (by attendance):** ${strongestSubject}
- **Weakest Subject (by attendance):** ${weakestSubject}
- **AI Learning Plan Status:** ${learningPathSummary}
---

**Instructions for Prediction:**
1.  **Analyze Holistically:** Consider how attendance patterns (especially in weaker subjects) and the presence of a structured learning plan might impact exam results. Higher attendance is a strong positive indicator. A learning plan shows proactivity.
2.  **Predicted Performance:** Provide a likely grade or percentage range (e.g., "B+ Grade (75-80%)").
3.  **Confidence Score:** Assign a confidence level to your prediction ('High', 'Medium', or 'Low'). High confidence for clear data patterns, Low if data is sparse or contradictory.
4.  **Rationale:** Briefly explain your reasoning in 1-2 sentences. Mention the key factors that influenced your prediction.
5.  **Output Format:** The output must be a clean, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
`;

    // 3. Define the response schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        predicted_performance: { type: Type.STRING, description: "The predicted grade or score range, e.g., 'A- Grade (85-90%)'." },
        confidence_score: { type: Type.STRING, description: "Confidence level of the prediction: High, Medium, or Low." },
        rationale: { type: Type.STRING, description: "A brief, encouraging explanation for the prediction based on the provided data." }
      },
      required: ["predicted_performance", "confidence_score", "rationale"]
    };

    // 4. Make the API call
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as PerformancePrediction;

  } catch (error) {
    console.error("Error predicting student performance:", error);
    return null;
  }
};

export const generateProgressInsights = async (progressData: SubjectProgress[], studentName: string): Promise<ProgressInsight | null> => {
  try {
    const model = 'gemini-2.5-flash';

    const prompt = `
You are an encouraging and insightful AI academic coach for a student named ${studentName}.
Analyze the provided academic progress data to identify key trends. Your tone should be supportive and constructive.

---
**Student's Academic Progress Data:**
${JSON.stringify(progressData, null, 2)}
---

**Instructions:**
1.  **Strengths:** Identify 1-2 subjects or trends where the student is performing well. Be specific (e.g., "Consistently high scores in Data Structures labs").
2.  **Areas for Improvement:** Identify 1-2 areas where the student could focus. Be gentle and specific (e.g., "Some assignments in Algorithms were submitted a day late, which could impact momentum.").
3.  **Actionable Advice:** Provide one clear, positive, and actionable piece of advice for the student. Example: "For the upcoming 'Graphs' problem set in Algorithms, try starting two days early to give yourself more time for the tricky edge cases. You've got this!"

**Output Format:**
The output MUST be a clean, valid JSON object adhering to the provided schema. Do not include any markdown formatting.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of positive observations about the student's performance."
        },
        areas_for_improvement: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of constructive observations for improvement."
        },
        actionable_advice: {
          type: Type.STRING,
          description: "A single, concise, and encouraging piece of advice."
        }
      },
      required: ["strengths", "areas_for_improvement", "actionable_advice"]
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ProgressInsight;

  } catch (error) {
    console.error("Error generating progress insights:", error);
    return null;
  }
};

export const generateActivitySuggestions = async (student: Student): Promise<ActivitySuggestion[] | null> => {
  try {
    const model = 'gemini-2.5-flash';

    // 1. Analyze student data to create a concise summary for the prompt
    let performanceSummary = `The student, ${student.name}, has the following academic profile:\n`;
    
    if (student.progress.length > 0) {
        student.progress.forEach(subject => {
            performanceSummary += `- In ${subject.subjectName}, their overall grade is ${subject.overallGrade}. Teacher feedback: "${subject.teacherFeedback}"\n`;
        });
    } else {
        performanceSummary += "- No detailed academic progress data is available.\n";
    }

    const highAttendanceSubjects = student.attendance
        .filter(a => a.status === 'Present')
        .reduce((acc, curr) => {
            acc[curr.subject] = (acc[curr.subject] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    const sortedSubjects = Object.entries(highAttendanceSubjects).sort((a, b) => b[1] - a[1]);
    
    if (sortedSubjects.length > 0) {
        performanceSummary += `- They have high attendance in: ${sortedSubjects.slice(0, 2).map(s => s[0]).join(', ')}.\n`;
    }

    // 2. Construct the prompt
    const prompt = `
You are an expert career counselor and academic advisor for a parent.
Your task is to analyze the student's academic profile and suggest personalized activities to help them grow.
The tone should be encouraging and directed at the parent.

---
**Student's Academic Profile:**
${performanceSummary}
---

**Instructions:**
1.  Based on the profile, identify the student's likely strengths and interests.
2.  Suggest 2-3 highly relevant, personalized activities, workshops, or online courses.
3.  For each suggestion, provide:
    -   A clear \`title\`.
    -   A brief \`description\` of the activity.
    -   A \`category\` from the list: 'Online Course', 'Workshop', 'Competition', 'Project Idea', 'Reading'.
    -   A \`rationale\` explaining why this suggestion is a good fit for the student, connecting it back to their academic profile.

**Output Format:**
The output MUST be a clean, valid JSON array of objects, strictly adhering to the provided schema. Do not include any markdown formatting.
`;

    // 3. Define the response schema
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the suggested activity or course." },
          description: { type: Type.STRING, description: "A brief description of what the activity involves." },
          category: { type: Type.STRING, description: "The type of activity (e.g., 'Online Course', 'Workshop')." },
          rationale: { type: Type.STRING, description: "The reason why this is a good suggestion for the student." }
        },
        required: ["title", "description", "category", "rationale"]
      }
    };

    // 4. Make the API call
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ActivitySuggestion[];

  } catch (error) {
    console.error("Error generating activity suggestions:", error);
    return null;
  }
};