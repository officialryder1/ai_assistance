import { PUBLIC_RAPIDAPI_KEY } from "$env/static/public"

if(!PUBLIC_RAPIDAPI_KEY){
    throw new Error("PUBLIC_RAPIDAPI_KEY is not set in the environment variables")
}

export async function convertTextToSpeech(text) {
    const url = 'https://open-ai-text-to-speech1.p.rapidapi.com/'
    const options = {
        method: "POST",
        headers: {
            'x-rapidapi-key': PUBLIC_RAPIDAPI_KEY,
            'x-rapidapi-host': 'open-ai-text-to-speech1.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'alloy'
        })
    }
    try{
        const response = await fetch(url, options)

        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const result = await response.blob()

        const audioUrl = URL.createObjectURL(result)

        if(audioUrl){
            const audio = new Audio(audioUrl)
            audio.play()
            console.log("Playing audio", audioUrl)
        } else{
            console.error("Audio generation failed", result)
        }
    } catch (error) {
        console.error("Error:", error)
    }
}