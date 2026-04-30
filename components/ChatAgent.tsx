'use client';

import { useState, useEffect, useRef } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownBasename, 
  WalletDropdownFundLink, 
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet';
import { 
  Swap, 
  SwapAmountInput, 
  SwapToggleButton, 
  SwapButton, 
  SwapMessage, 
  SwapToast 
} from '@coinbase/onchainkit/swap';
import { Avatar, Name, Identity, Address, EthBalance } from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'motion/react';
import { Send as SendIcon, Bot, User, Loader2, Sparkles, ArrowLeftRight } from 'lucide-react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '' });

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: 'swap';
}

export default function ChatAgent() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Base Agent. I can help you swap tokens or check your balance on Base. What can I do for you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { isConnected, address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Farcaster Mini App
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: `You are an onchain assistant on the Base network. The user is connected with address: ${address ?? 'not connected'}. 
          If the user wants to swap, encourage them to use the swap tool below. 
          Keep responses concise and helpful. 
          Current user message: ${userMsg}` }] }
        ],
        config: {
          systemInstruction: "You are BaseAgent, a friendly AI assistant for the Base blockchain. You help users navigate DeFi. You can't execute transactions directly, but you can guide users to the UI tools provided."
        }
      });

      const assistantMsg = response.text || "I'm sorry, I couldn't process that.";
      
      // Basic intent detection for UI components
      let action: Message['action'] = undefined;
      if (assistantMsg.toLowerCase().includes('swap')) action = 'swap';

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg, action }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong with my logic processors. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border-x border-slate-800 bg-slate-950">
      {/* Header */}
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">BaseAgent</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AI Assistant
            </p>
          </div>
        </div>

        <Wallet>
          <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all">
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownBasename />
            <WalletDropdownFundLink />
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-blue-600'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none'}`}>
                    <ReactMarkdown className="prose prose-invert text-sm leading-relaxed">
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Contextual Actions */}
                  {msg.action === 'swap' && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-blue-400">
                        <ArrowLeftRight className="w-4 h-4" />
                        Swap Tokens on Base
                      </div>
                      <Swap>
                        <SwapAmountInput label="Sell" swappableTokens={[]} type="from" />
                        <SwapToggleButton />
                        <SwapAmountInput label="Buy" swappableTokens={[]} type="to" />
                        <SwapButton className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl transition-all" />
                        <SwapMessage />
                        <SwapToast />
                      </Swap>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
               <Bot className="w-4 h-4" />
             </div>
             <div className="bg-slate-800 text-white p-4 rounded-2xl rounded-tl-none">
               <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me to swap ETH, check balance..."
            className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-4 pr-16 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-white placeholder-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 disabled:bg-slate-700 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini & Base
        </p>
      </footer>
    </div>
  );
}
