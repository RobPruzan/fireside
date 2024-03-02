import { useState } from "react";
import { client } from "@/main";

function Chat(){

    const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    
    const res = await client.user.chat.post{
        
    }

    console.log('Message sent:', message);  
    setMessage("");
  };

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