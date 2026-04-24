/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, Book, Sparkles, Languages, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface VerseData {
  reference: string;
  english: string;
  korean: string;
  pronunciation: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translateVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setVerse(null);

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Bible Verse Reference: ${query}`,
        config: {
          systemInstruction: `You are a specialist in the Bible and linguistics. 
          The user will provide a Bible verse reference in Korean or English.
          Your task is to retrieve the verse and return it as a JSON object.
          
          JSON structure:
          {
            "reference": "Full English reference (e.g. Matthew 4:4)",
            "english": "NIV version of the verse",
            "korean": "Standard Korean translation (개역개정/KRV)",
            "pronunciation": "Full English verse phonetically written in Korean Hangeul (e.g. '인 더 비기닝...')"
          }

          Rules:
          - Response MUST be a single JSON object.
          - If the verse is not found, return: { "error": "해당 성경 구절을 찾을 수 없습니다. 정확한 장과 절을 입력해 주세요." }
          - ALWAYS provide the 'pronunciation' in natural Korean Hangeul.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reference: { type: Type.STRING },
              english: { type: Type.STRING },
              korean: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
              error: { type: Type.STRING },
            },
            required: ["reference", "english", "korean", "pronunciation"],
          },
        },
      });

      const text = response.text;
      console.log('Gemini Response:', text);
      
      if (!text) {
        throw new Error('응답을 받을 수 없습니다.');
      }

      const data = JSON.parse(text);

      if (data.error) {
        setError(data.error);
      } else if (!data.english || !data.korean) {
        setError('구절 정보를 올바르게 가져오지 못했습니다.');
      } else {
        setVerse(data);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('검색 중 오류가 발생했습니다. 구절 형식을 확인(예: 마태복음 4:4)하거나 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg font-sans text-theme-ink flex flex-col items-center">
      <div className="w-full max-w-7xl px-8 md:px-12 py-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center pb-8 border-b-2 border-theme-ink mb-10 gap-6">
          <div className="text-2xl font-extrabold tracking-tighter uppercase self-start md:self-auto">
            ScriptureLink.
          </div>
          
          <form onSubmit={translateVerse} className="relative w-full max-w-md">
            <div className="flex items-center bg-theme-box px-6 py-3 rounded-full border border-black/10 focus-within:ring-1 focus-within:ring-theme-accent transition-all">
              <Search className="w-5 h-5 text-theme-ink/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예) 마태복음 4:4"
                className="bg-transparent border-none outline-none w-full ml-3 text-base placeholder:text-theme-ink/40 font-sans"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="ml-2 p-1 hover:text-theme-accent transition-colors disabled:opacity-30"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>
          </form>

          <div className="text-xs font-bold uppercase tracking-wider hidden md:block">
            PREMIUM PLAN: UNLIMITED ACCESS
          </div>
        </header>

        {/* Main Display */}
        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {verse ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center justify-center py-6"
              >
                {/* Verse Box */}
                <div className="flex flex-col justify-center">
                  <div className="font-serif italic text-xl text-theme-accent mb-2">
                    {verse.reference}
                  </div>
                  <h1 className="font-serif text-[42px] leading-[1.1] font-bold tracking-tight mb-8">
                    “{verse.english}”
                  </h1>
                  <button 
                    onClick={() => { setVerse(null); setQuery(''); }}
                    className="self-start text-[11px] uppercase tracking-widest font-bold border-b border-theme-ink pb-0.5 hover:text-theme-accent hover:border-theme-accent transition-all"
                  >
                    Search another verse
                  </button>
                </div>

                {/* Translation Section */}
                <div className="flex flex-col gap-8">
                  <div className="border-l-[4px] border-theme-accent pl-6">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-theme-accent mb-2">
                      Korean Meaning • 한국어 뜻
                    </div>
                    <p className="text-xl font-medium leading-relaxed text-theme-ink break-keep">
                      {verse.korean}
                    </p>
                  </div>

                  <div className="border-l-[4px] border-theme-accent pl-6">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-theme-accent mb-2">
                      Pronunciation • 한국어 발음 가이드
                    </div>
                    <div className="bg-theme-pronunciation p-4 rounded-lg italic text-lg leading-relaxed text-theme-ink/70">
                      "{verse.pronunciation}"
                    </div>
                  </div>
                  
                  <div className="border-l-[4px] border-theme-accent pl-6">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-theme-accent mb-2">
                      Biblical Wisdom • 성경의 지혜
                    </div>
                    <p className="text-sm text-theme-ink/60 font-light">
                      이 구절은 우리 삶의 영적인 양식과 믿음의 중요성을 일깨워 줍니다.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-1 py-20"
              >
                <Loader2 className="w-12 h-12 text-theme-accent animate-spin mb-4" />
                <p className="font-serif italic text-lg text-theme-accent">Reflecting on the word...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center bg-red-50/50 p-12 rounded-3xl border border-red-100"
              >
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="text-xs uppercase tracking-widest font-bold underline"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-10"
              >
                <div className="lg:w-1/2">
                  <h2 className="font-serif text-5xl font-bold leading-tight mb-6">
                    Learn the Bible <br/> 
                    <span className="text-theme-accent italic">in English.</span>
                  </h2>
                  <p className="text-lg text-theme-ink/60 font-light max-w-md">
                    성경 구절을 통해 영어 실력을 키우고 영적인 영감을 얻으세요.
                    지금 바로 구절을 입력하여 시작해보세요.
                  </p>
                </div>
                <div className="lg:w-1/3 p-8 border-2 border-theme-ink border-dashed rounded-3xl opacity-40">
                  <Book className="w-12 h-12 mb-4" />
                  <p className="text-sm italic">"Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-auto pt-10 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-[11px] font-bold uppercase tracking-wider">DAILY QUOTA (142 / 1,000)</span>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[15%] bg-theme-ink rounded-full" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-accent">High Capacity Active</span>
          </div>
          
          <div className="flex gap-8 items-center text-[11px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-theme-accent transition-colors underline">View Search History</a>
            <span className="text-theme-ink/30">© 2026 SCRIPTURELINK.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
