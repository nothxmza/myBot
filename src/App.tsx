import { useState, useEffect } from 'react'
import axios from 'axios'
import styled from 'styled-components'
import { Squirrel, Cat, Dog, Rabbit, Bird, MessageCircle, Send, Plus, Trash2, Columns } from 'lucide-react'

const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`

const WrapperChat = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #3f3f3f;
`
const WrapperMessage = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 20px);
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 40px;
`

const WrapperForm = styled.div`
  position: fixed;
  height: 20px;
  width: calc(100% - 300px);
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #3f3f3f;
`

const Button = styled.button`
  background-color: #3f3f3f;
  border: none;
  color: #fff;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
  width: 100px;
  height: 50px;
`

const IconButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
  gap: 8px;
  padding: 8px 16px;
  
  &:hover {
    background-color: #4f4f4f;
  }
`
const IconButtonList = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
  gap: 8px;
  padding: 8px 16px;
  &:hover {
    background-color: #4f4f4f;
  }
`

const IconButtonStart = styled(Button)`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
  padding: 8px 16px;
  
  &:hover {
    background-color: #4f4f4f;
  }
`

interface Channel {
  id: number;
  name: string;
  messages: {
    role: "user" | "assistant";
    content: {
      text: string;
      image: string;
    };
  };
}

function App() {
  const [count, setCount] = useState(0);
  const [request, setRequest] = useState('');
  const [flag, setFlag] = useState(false);
  const [responseBot, setResponseBot] = useState('');
  const [dataChannel, setDataChannel] = useState<Channel | undefined>();
  const [listChannel, setListChannel] = useState<Channel[]>([]);
  const [idChannel, setIdChannel] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [base64Image, setBase64Image] = useState('');
  const [detectFile, setDetectFile] = useState(false);
  const [prePrompt, setPrePrompt] = useState("Tu es un assistant virtuel serviable et amical. Tu dois toujours répondre en français. tu vas être une assistance pour conseille sur l’adoption d’animaux et demander s'il a besoin de plus d'informations.");
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number>(0);

  const dataImage = {
    model: "llava-v1.5-7b",
    messages: [
      { 
        role: "user",
        content: [
          {
            type: "text",
            text: "What is this image?"
          },
          {
            type: "image_url",
            image_url: { url: "" }
          }
        ]
      }
    ],
    temperature: 0.7,
    max_tokens: -1,
    stream: false
  };

  const data = {
    model: "llava-v1.5-7b",
    messages: [ 
      { role: "system", content: "" },
      { role: "assistant", content: "" },
      { role: "user", content: "" }
    ], 
    temperature: 0.7, 
    max_tokens: -1,
    stream: false
  };

  useEffect(() => {
    const storedListChannel = localStorage.getItem('listChannel');
    const listChannel = storedListChannel ? JSON.parse(storedListChannel) : [];
    setListChannel(listChannel);
  }, []);

  const handleRequest = async () => {
    setIsLoaded(true);
    setDetectFile(false)
    let botResponse;
    let response;
    const userMessage = {
      role: "user",
      content: {
        text: request,
        image: ''
      }
    };

    if (base64Image) {
      userMessage.content.image = base64Image;
    }

    const newMessages = [...(dataChannel?.messages || []), userMessage];
    let updatedChannel: Channel = {
      ...dataChannel!,
      messages: newMessages
    };

    if (base64Image) {
      dataImage.messages[0].content[1].image_url.url = base64Image;
      dataImage.messages[0].content[0].text = request;
      response = await axios.post("http://127.0.0.1:1234/v1/chat/completions",dataImage);
    } else {
      data.messages[0].content = prePrompt;
      data.messages[2].content = request;
      if (responseBot) {
        data.messages[1].content = responseBot;
      }
      response = await axios.post("http://127.0.0.1:1234/v1/chat/completions",data);
    }

    botResponse = response.data.choices[0].message.content;
    console.log(botResponse);

    if (!botResponse || botResponse === "") {
      botResponse = "Je n'ai pas compris votre question, pouvez-vous reformuler ?";
    }

    if (response) {
      setIsLoaded(false);
    }
    setResponseBot(botResponse);

    const botMessage = {
      role: "assistant",
      content: {
        text: botResponse,
        image: ''
      }
    };

    const finalMessages = [...newMessages, botMessage];
    updatedChannel = {
      ...dataChannel!,
      messages: finalMessages
    };
    setDataChannel(updatedChannel);

    const updatedListChannel = listChannel.map((channel) =>
      channel.id === dataChannel!.id ? updatedChannel : channel
    );
    setListChannel(updatedListChannel);
    localStorage.setItem("listChannel", JSON.stringify(updatedListChannel));

    setRequest("");
    setBase64Image("");
  };

  const handleChannel = () => {
    const animalIcons = ['🐱', '🐶', '🐰', '🐦', '🐹'];
    const randomIcon = animalIcons[Math.floor(Math.random() * animalIcons.length)];
    const newChannel: Channel = {
      id: listChannel.length + 1,
      name: `Animal chat ${randomIcon}`,
      messages: []
    };
    const newListChannel = [...listChannel, newChannel];
    setListChannel(newListChannel);
    localStorage.setItem("listChannel", JSON.stringify(newListChannel));
    localStorage.setItem("idChannel", (idChannel + 1).toString());
    setIdChannel(idChannel + 1);
  };

  const redirectChannel = (index: number) => {
    setSelectedChannelIndex(index)
    setDataChannel(listChannel[index]);
  };

  const deleteChannel = (index: number, e) => {
    e.stopPropagation();
    const newListChannel = listChannel.filter((_, i) => i !== index);
    setListChannel(newListChannel);
    localStorage.setItem("listChannel", JSON.stringify(newListChannel));

    if(newListChannel.length === 0){
      console.log("delete");
      localStorage.removeItem("idChannel");
    }
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setBase64Image(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  console.log(prePrompt)
  return (
    <Wrapper>
      {listChannel.length > 0 ? (
        <>
          <div style={{ width: "400px", height: "100vh", backgroundColor: "#212020", padding: "10px", display: "flex", flexDirection: "column", overflow: "hidden", justifyContent: "space-between" }}>
            <div style={{maxHeight: 500, overflow: "scroll"}}>
              {listChannel.map((channel, index) => (
              <IconButtonList key={index} onClick={() => redirectChannel(index)} style={{ backgroundColor: selectedChannelIndex === index ? '#4f4f4f' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={20} />
                  {channel.name}
                </div>
                <Trash2
                  size={20}
                  onClick={(e) => deleteChannel(index, e)}
                  style={{ cursor: 'pointer' }}
                />
              </IconButtonList>
            ))}
            </div>
            <div>
            <div style={{ marginBottom: "15px", display: 'flex' }}>
              <textarea
                value={prePrompt}
                style={{
                  width: "100%",
                  height: "200px",
                  backgroundColor: "#2e2e2e",
                  color: "#fff",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid #555"
                }}
                onChange={(e) => setPrePrompt(e.target.value)}
              />
            </div>
            <IconButton onClick={handleChannel} style={{ marginTop: "auto", marginBottom: "15px" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} />
                Nouveau chat
              </div>
            </IconButton>
            </div>
          </div>

          <WrapperChat>
            <div style={{ width: "100%", height: "50px", color: "white", backgroundColor: "#2e2e2e", padding: "10px", display: "flex", alignItems: "center", gap: 10 }}>
              <Cat size={24} />
              <Dog size={24} />
              <Rabbit size={24} />
              <Bird size={24} />
              <h1 style={{ margin: 0 }}>Animal chat</h1>
            </div>
            <WrapperMessage>
              {dataChannel?.messages.map((message, index) => (
                (message.content.text || message.content.image) && (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: "20px"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: message.role === "user" ? "#4f5351" : "#2e2e2e",
                        color: "#fff",
                        borderRadius: "15px",
                        padding: "12px 16px",
                        maxWidth: "70%",
                        gap: "10px"
                      }}
                    >
                      {message.content.text}
                      {message.content.image && (
                        <img
                          src={message.content.image}
                          style={{ width: "100px", borderRadius: "10px"}}
                        />
                      )}
                    </div>
                  </div>
                )
              ))}
            </WrapperMessage>
            <WrapperForm>
              <input type="text" value={request} placeholder="Posez votre question sur les animaux..." onChange={(e) => setRequest(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid #555",
                  width: "60%",
                  backgroundColor: "#2e2e2e",
                  color: "white"
                }}
              />
              <input type="file" onChange={handleImage}
                style={{
                  marginLeft: "10px",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #555",
                  backgroundColor: "#2e2e2e",
                  color: "white"
                }}
              />
              <IconButton onClick={handleRequest} style={{ width: "auto" }}>
                <Send size={20} />
              </IconButton>
            </WrapperForm>
          </WrapperChat>
        </>
      ) : (
        <div style={{ width: "100vw", height: "100vh", backgroundColor: "#212020", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IconButtonStart onClick={handleChannel}>
            <Plus size={20} />
            Nouveau chat
          </IconButtonStart>
        </div>
      )}
    </Wrapper>
  );
}

export default App;
