import { useState } from "react";
// import { client } from "@/main";
import {client} from "@/edenClient";

function Chat(){

    const [message, setMessage] = useState('');

  const handleSendMessage = async (t: any) => {
    
      const res = await client.user.chat.post({
        
          // id: ,/*No clue on how to get the  id */,
          displayName: client.user.username,/* idk how to get the users id/dispalyName */
          roomName: "Default", // Replace with the actual room name
          chatMessage: message,
        
      });
    }

    console.log('Message sent:', message);  
    setMessage("");
  

    return(
        <div>
            <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}

export default Chat;