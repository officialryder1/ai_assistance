import Groq from "groq-sdk";
import { GROQ_API_KEY } from "$env/static/private";
import { json } from "@sveltejs/kit";

if(!GROQ_API_KEY){
    throw new Error("GROQ_API_KEY is not set in the environment variables")
}

const client = new Groq({
    apiKey: GROQ_API_KEY
})

export async function POST({request}) {
    try{
        const { message } = await request.json()
        console.log(message)

        if(!message || !Array.isArray(message) || message.length === 0){
            return json({message: "Message history is required"}, {status: 400})
        }

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are a social media AI assistant that generates highly engaging tweets. Respond creatively, be interactive, and adjust to feedback given in the chat.",
                },
                ...message,
            ],
            model: "llama3-8b-8192",
            stream: true,
        })
        
        return new Response(
            new ReadableStream({
                async start(controller){
                    try{
                        for await(const chunk of response){
                            const content = chunk.choices[0]?.delta?.content || ""
                            controller.enqueue(new TextEncoder().encode(content))
                        }
                        controller.close()
                    } catch(error){
                        controller.error(error)
                    }
                }
            }),
            {
                headers: {
                    "Content-Type": "text/plain; charset-utf-8",
                    "Cache-Control": "no-cache"
                }
            }
        )
    }
    catch(error){
        return new Response(
            JSON.stringify({
                success:false,
                error: error.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": 'application'
                }
            }
        )
    }
} 