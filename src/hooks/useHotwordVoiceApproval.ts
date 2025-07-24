import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from './useAppStore'
import { approveRequest, rejectRequest } from '../store/slices/approvalSlice'

// Hotword and command phrases
const HOTWORD = 'hey sovren'
const APPROVE_PHRASES = ['approve', 'approved', 'yes', 'proceed']
const DENY_PHRASES = ['deny', 'denied', 'reject', 'no']

export function useHotwordVoiceApproval() {
  const dispatch = useAppDispatch()
  const approvals = useAppSelector(state => state.approvals?.pendingApprovals || [])
  const [isListening, setIsListening] = useState(false)
  const [isHotwordDetected, setIsHotwordDetected] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Setup SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    let awaitingCommand = false

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ')
        .toLowerCase()
        .trim()
      setLastTranscript(transcript)
      if (!awaitingCommand && transcript.includes(HOTWORD)) {
        setIsHotwordDetected(true)
        awaitingCommand = true
        // Listen for command for 5 seconds
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current)
        commandTimeoutRef.current = setTimeout(() => {
          setIsHotwordDetected(false)
          awaitingCommand = false
        }, 5000)
      } else if (awaitingCommand && (transcript.includes('approve') || transcript.includes('deny'))) {
        // Parse command
        let matchedApprovalId: string | null = null
        let matchedExec: string | null = null
        // Try to match by executive name if present
        for (const approval of approvals) {
          if (approval.executive && transcript.includes(approval.executive.name.toLowerCase())) {
            matchedApprovalId = approval.id
            matchedExec = approval.executive.name
            break
          }
        }
        // Fallback to top approval
        if (!matchedApprovalId && approvals.length > 0) {
          matchedApprovalId = approvals[0].id
        }
        if (matchedApprovalId) {
          if (APPROVE_PHRASES.some(p => transcript.includes(p))) {
            dispatch(approveRequest(matchedApprovalId))
          } else if (DENY_PHRASES.some(p => transcript.includes(p))) {
            dispatch(rejectRequest(matchedApprovalId))
          }
        }
        setIsHotwordDetected(false)
        awaitingCommand = false
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current)
      }
    }
    recognition.onerror = (event: any) => {
      setIsListening(false)
      setIsHotwordDetected(false)
      console.error('Speech recognition error:', event)
    }
    recognition.onend = () => {
      setIsListening(false)
      setIsHotwordDetected(false)
      // Auto-restart for always-listening
      recognition.start()
      setIsListening(true)
    }
    recognition.start()
    setIsListening(true)
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
      setIsListening(false)
      setIsHotwordDetected(false)
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current)
    }
  }, [dispatch, approvals])

  return {
    isListening,
    isHotwordDetected,
    lastTranscript
  }
} 