import { useState} from 'react';
import GlowLine from './components/GlowLine';
import BitcoinIcon from './components/Icons/BitcoinIcon.svg';
import { Cpu } from "lucide-react";


function App() {

  return (
    <div className="w-screen h-screen bg-[#1E1D2B] flex items-center justify-center">  
      <div className="w-fill bg-[#101018] text-white rounded-2xl mx-auto border-[#1B1B23]">
        <div className="flex items-center justify-between border-b border-[#1B1B23] p-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#191923] p-4 rounded-lg">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className='ml-1'>
              <h2 className="text-xl font-medium mb-1">Hardware Usage</h2>
              <p className="text-sm text-[#6B6A7D]">
                <span className="text-[#6A5DF4]">57%</span> <span className='text-[#414149] ml-1 mr-1'>•</span> <span>24 seconds ago</span>
              </p>
            </div>
          </div>

          <div className="flex items-center bg-[#0E0D13] rounded-lg px-1.5 py-1.5">
            <div className="text-m text-white px-6 py-2 rounded-md bg-[#1A1A24]">CPU</div>
            <div className="text-m text-[#6B6A7D] px-6 py-2 rounded-md hover:cursor-pointer">GPU</div>
            <div className="text-m text-[#6B6A7D] px-6 py-2 rounded-md hover:cursor-pointer">RAM</div>
          </div>
        </div>

        <div className='p-6 overflow-visible cursor-pointer'>
          <GlowLine/>
        </div>
      </div>
    </div>  
  );
}

export default App;
