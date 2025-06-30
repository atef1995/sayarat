import { CarInfo } from "../types";
import { User } from "./api.types";

export interface Conversation {
  title: string;
  picture: string;
  conversation_id: string;
  car_listing_id: string;
  created_at: string;
  updated_at: string;
  role: "buyer" | "seller";
  last_message: string;
  last_message_time: string;
  make: CarInfo["make"];
  model: CarInfo["model"];
  url: string;
  is_read: number;
  sender: string;
  sender_id: User["id"];
  receiver: string;
}
