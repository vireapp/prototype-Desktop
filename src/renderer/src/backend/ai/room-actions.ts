import { createClient } from "@/lib/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VIRE_SYSTEM_PROMPT } from "./system-prompt";
import { getRoomRole } from "@/components/rooms/actions";

export async function chatWithRoomAI(
  roomId: string,
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any[],
  roomContext: {
    name: string;
    description: string;
    activity: string;
    personality?: string;
  },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    const userName = profile?.username || "User";

    await supabase.from("ai_chat_history").insert({
      user_id: user.id,
      role: "user",
      content: `[Room: ${roomContext.name}] ${message}`,
    });

    const userRole = await getRoomRole(roomId);
    const { data: roomData } = await supabase
      .from("rooms")
      .select("permissions")
      .eq("id", roomId)
      .single();

    const aiSettings = roomData?.permissions?.aiSettings || {
      aiCanChangeMusic: true,
      aiCanChangeTheme: true,
      aiCanSwitchActivity: true,
      aiCanTriggerReactions: true,
      aiCanKickUsers: false,
      aiCanLockRoom: false,
      aiCanClearChat: false,
      aiCanUpdateRoomInfo: false,
    };

    const systemPrompt = `
${VIRE_SYSTEM_PROMPT}

### CURRENT CONTEXT
Current Room: "${roomContext.name}"
Description: "${roomContext.description || "No description"}"
Current Activity: ${roomContext.activity}
User: ${userName}
User Role: ${userRole}
AI Settings (Granular Permissions for this room):
${JSON.stringify(aiSettings, null, 2)}
Personality Code: ${roomContext.personality || "friendly"}
`;

    // Initialize Gemini Direct
    const genAI = new GoogleGenerativeAI(
      (process.env.GOOGLE_GENAI_API_KEY || "").replace(/"/g, ""),
    );
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: (() => {
        const processedHistory = history.map((h) => ({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: h.content[0]?.text || h.content || "" }], // Handle different history formats
        }));
        while (processedHistory.length > 0 && processedHistory[0].role === "model") {
          processedHistory.shift();
        }
        return processedHistory;
      })(),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    if (text) {
      await supabase.from("ai_chat_history").insert({
        user_id: user.id,
        role: "model",
        content: text,
      });
    }

    return { response: text };
  } catch (error) {
    console.error("Room AI Error:", error);
    return { error: "Failed to generate response" };
  }
}
