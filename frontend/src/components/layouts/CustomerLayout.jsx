import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import ChatBot from '../common/ChatBot'

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="page-enter"><Outlet /></div>
      </main>
      <ChatBot />
    </div>
  )
}
