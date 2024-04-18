import React, { useState, useEffect } from 'react';
import { Button} from "../ui/button"; // Adjust the import path based on your project structure
import { Users } from "lucide-react";
import { useDefinedUser } from "./camps-state";
import { client } from "@/edenClient";
import { useParams } from "@tanstack/react-router";
const UserList = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
  const toggleUsers = () => setShowUsers(!showUsers);

  return (
    <div>
      <Button variant="ghost" onClick={toggleUsers}>
        <Users />
      </Button>
      {showUsers && (
        <div>
          {activeUsers.length > 0 ? (
            <ul>
              {users.map(userToMap => (
                <li key={userToMap.id}>{userToMap.name}</li> 
              ))}
            </ul>
          ) : (
            <p>No active users found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserList;
