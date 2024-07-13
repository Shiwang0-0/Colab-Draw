import { createContext, useState } from "react";

const RoomContext=createContext();

const RoomProvider = ({children}) => {

    const [roomName,setRoomName]=useState("")

  return (
    <RoomContext.Provider value={{roomName,setRoomName}}>
        {children}
    </RoomContext.Provider>
  )
}

export { RoomContext, RoomProvider };

