<script>
	import { Models } from "groq-sdk/resources/models.mjs";
    import { onMount } from "svelte";
	import { get, writable } from "svelte/store";

    import { convertTextToSpeech } from "../utils/tts";
    

    let recognition;
    let isListening = $state(false);
    let transcriptText = $state("");
    let response = $state('')
    let isLoading = $state(false)

    let message = writable([])
  
    // Initialize speech recognition in the browser
    onMount(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "en-US";
        recognition.interimResults = true;

        recognition.onstart = () => {
        console.log("Speech recognition started...");
        isListening = true;
        };

        recognition.onresult = (event) => {
        transcriptText = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
        console.log("Transcription:", transcriptText);
        };

        recognition.onerror = (event) => {
        console.error("Error:", event.error);
        };

        recognition.onend = () => {
        console.log("Speech recognition ended.");
        isListening = false;
        sendInput()
        
        
        };
    } else {
        console.error("Speech recognition not supported in this browser.");
    }
    });

    function toggleListening() {
    if (recognition) {
        isListening ? recognition.stop() : recognition.start();
        
    }
    }

    async function sendInput(){
        response = ""
        isLoading = true
        message.update((msg) => [
            ...msg,
            {role: "user", content: transcriptText}
        ])
        try{
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: get(message)
                })
            })

            if(!res.body) {
                throw new Error("No response body received.")
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { done, value} = await reader.read()
                if (done) break;
                response += decoder.decode(value, { stream: true})

                message.update((msgs) => [
                ...msgs,
                { role: "assistant", content: response },
            ]);
            }
            
        } catch(err){
            response = `Error: ${err.message}`
        } finally {
            isLoading = false
            speak()
        }
    }

    async function speak(){
        const utterance = new SpeechSynthesisUtterance(response)

        const voices = speechSynthesis.getVoices()
        utterance.voice = voices[1]

        speechSynthesis.speak(utterance)

        // await convertTextToSpeech(response)
    }

    
</script>

<div>
    <button class="btn btn-success text-white" onclick={toggleListening} class:red={isListening}>{isListening ? "Stop Listening" : "Start Listening"}</button>
</div>
<hr>
<!-- {#if response}
    <p>{response}</p>
{/if} -->

<div class="chat-container">
    <div class="message user">
        <span class="sender">user</span>
        <p class="content">{transcriptText}</p>
    </div>
</div>
{#if $message.length}
    <div class="chat-container">
        <div class="message {message.role}">
            <span class="sender">{message.role === 'user' ? 'You' : 'Assistant'}:</span>
            <p class="content">{response}</p>
        </div>
    </div>
{/if}
<style>
     button.red {
        background-color: red;
    }
    /* Chat container styling */
    .chat-container {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Message container */
    .message {
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 8px;
        line-height: 1.5;
    }

    /* User messages */
    .message.user {
        background: #d1e7dd;
        text-align: right;
    }

    /* AI Assistant messages */
    .message.assistant {
        background: #fff;
        text-align: left;
    }

    /* Sender label */
    .sender {
        display: block;
        font-weight: bold;
        margin-bottom: 5px;
    }

    /* Content text */
    .content {
        font-size: 1rem;
        color: #212529;
    }

</style>