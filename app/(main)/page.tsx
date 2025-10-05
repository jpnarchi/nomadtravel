import { Chat } from "@/components/hero/chat"
import { redirect } from "next/navigation"

export default function Home() {
  return redirect('/db')
  return <Chat />
}