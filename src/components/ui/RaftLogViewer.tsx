'use client'

import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/useReduxStore';

const RaftLogViewer: React.FC = () => {
  const raftState = useAppSelector(state => state.raft);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  
  // Get log entries with pagination
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const totalPages = Math.ceil(raftState.log.length / pageSize);
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, raftState.log.length);
  const visibleEntries = raftState.log.slice(startIndex, endIndex);
  
  const handlePrevPage = () => {
    setPage(Math.max(0, page - 1));
  };
  
  const handleNextPage = () => {
    setPage(Math.min(totalPages - 1, page + 1));
  };
  
  const toggleExpand = (index: number) => {
    setExpandedEntry(expandedEntry === index ? null : index);
  };
  
  return (
    <div className="bg-black/80 rounded-md p-4 text-sm">
      <h3 className="text-white font-medium mb-2">RAFT Log Entries</h3>
      
      {raftState.log.length === 0 ? (
        <div className="text-gray-400 text-xs">No log entries</div>
      ) : (
        <>
          <div className="space-y-2">
            {visibleEntries.map((entry, i) => {
              const actualIndex = startIndex + i;
              const isCommitted = actualIndex <= raftState.commitIndex;
              const isExpanded = expandedEntry === actualIndex;
              
              return (
                <div 
                  key={actualIndex}
                  className={`border ${isCommitted ? 'border-green-800' : 'border-gray-700'} rounded p-2`}
                >
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpand(actualIndex)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isCommitted ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-white text-xs">
                        Entry {actualIndex} (Term {entry.term})
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-2 text-xs">
                      <div className="bg-gray-800 p-2 rounded overflow-auto max-h-32">
                        <pre className="text-gray-300">
                          {JSON.stringify(entry.command, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-3 text-xs">
              <button
                onClick={handlePrevPage}
                disabled={page === 0}
                className={`px-2 py-1 rounded ${page === 0 ? 'bg-gray-800 text-gray-500' : 'bg-blue-800 text-white'}`}
              >
                Previous
              </button>
              
              <span className="text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={page === totalPages - 1}
                className={`px-2 py-1 rounded ${page === totalPages - 1 ? 'bg-gray-800 text-gray-500' : 'bg-blue-800 text-white'}`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RaftLogViewer;