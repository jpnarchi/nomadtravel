import { Chat } from "@/components/chat"
import { generateUUID } from "@/lib/utils"

export default function Home() {
  return <Chat id={generateUUID()} initialMessages={[]} />
}