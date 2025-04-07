"use client";
import { auth } from "@/configs/firebaseConfig";
import { signOut } from "firebase/auth";
import React from "react";
import { useAuthContext } from "../provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function ProfileAvatar() {
  const user = useAuthContext();
  const router = useRouter();

  const onButtonPress = () => {
    signOut(auth)
      .then(() => {
        router.replace("/");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const getInitial = () => {
    const name = user?.user?.displayName || user?.user?.email || "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger>
          {user?.user?.photoURL ? (
            <img
              src={user.user.photoURL}
              alt="profile"
              className="w-[35px] h-[35px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[35px] h-[35px] rounded-full bg-gray-300 text-white flex items-center justify-center font-semibold">
              {getInitial()}
            </div>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[100px] max-w-sm">
          <Button variant="ghost" onClick={onButtonPress}>
            Logout
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ProfileAvatar;
