export async function load({fetch}){
    const response = await fetch('/api/chat')
    const render = response.body?.getReader()
    const decoder = new TextDecoder();
    let content = ""

    return {
        stream: {
            async *[Symbol.asyncIterator](){
                while (true){
                    const { done, value } = await render.read()
                    if (done) break;

                    content += decoder.decode(value, {stream: true})
                    yield content
                }
            }
        }
    }
}