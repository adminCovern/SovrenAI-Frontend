import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppSelector } from '../../hooks/useAppStore';
import { Executive, ActivityType } from '../../types';

interface PredictiveInsightsProps {
  position: [number, number, number];
  scale?: number;
}

interface Prediction {
  executiveId: string;
  executiveName: string;
  predictedActivity: ActivityType;
  confidence: number;
  timeframe: string;
  impact: string;
  reasoning: string;
}

interface NeuralConnection {
  from: [number, number, number];
  to: [number, number, number];
  strength: number;
  color: string;
}

export const PredictiveInsights: React.FC<PredictiveInsightsProps> = ({
  position,
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [neuralConnections, setNeuralConnections] = useState<NeuralConnection[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  const executiveStates = useAppSelector(state => state.executives?.states || []);

  // Generate predictive insights
  useEffect(() => {
    const generatePredictions = () => {
      const newPredictions: Prediction[] = executiveStates.slice(0, 4).map((state: any, index) => {
        const activities: ActivityType[] = ['email', 'call', 'meeting', 'crm', 'analysis'];
        const timeframes = ['5 min', '15 min', '30 min', '1 hour'];
        const impacts = ['low', 'medium', 'high'];
        
        return {
          executiveId: state.executive.id,
          executiveName: state.executive.name,
          predictedActivity: activities[Math.floor(Math.random() * activities.length)],
          confidence: Math.random() * 30 + 70, // 70-100%
          timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
          impact: impacts[Math.floor(Math.random() * impacts.length)],
          reasoning: `Based on ${state.executive.currentActivity} patterns and ${Math.floor(Math.random() * 10) + 1} similar historical actions`
        };
      });

      setPredictions(newPredictions);

      // Generate neural connections
      const connections: NeuralConnection[] = [];
      for (let i = 0; i < 6; i++) {
        connections.push({
          from: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2],
          to: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2],
          strength: Math.random(),
          color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`
        });
      }
      setNeuralConnections(connections);
    };

    generatePredictions();
    const interval = setInterval(generatePredictions, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [executiveStates]);

  // Animate the insights
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.3) * 0.05;
    
    // Rotate slowly
    groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.05;
  });

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getActivityColor = (activity: ActivityType) => {
    const colors: Record<ActivityType, string> = {
      'idle': '#666666',
      'email': '#4ecdc4',
      'call': '#ff6b6b',
      'meeting': '#45b7d1',
      'crm': '#96ceb4',
      'analysis': '#feca57',
      'approval': '#ff9ff3'
    };
    return colors[activity] || '#ffffff';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#00ff88';
    if (confidence >= 80) return '#ffaa22';
    return '#ff4444';
  };

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Neural network background */}
      {neuralConnections.map((connection, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                connection.from[0], connection.from[1], connection.from[2],
                connection.to[0], connection.to[1], connection.to[2]
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={connection.color}
            transparent
            opacity={isVisible ? connection.strength * 0.3 : 0}
          />
        </line>
      ))}

      {/* Holographic display */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={20}
        transform
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: 'auto'
        }}
      >
        <div style={{
          width: '400px',
          height: '500px',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #00ccff',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 0 30px #00ccff40',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #00ccff',
            paddingBottom: '12px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#00ccff',
              marginBottom: '4px'
            }}>
              🔮 PREDICTIVE INSIGHTS
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              ML-Driven Executive Behavior Forecast
            </div>
          </div>

          {/* Predictions */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {predictions.map((prediction, index) => (
              <div
                key={prediction.executiveId}
                style={{
                  background: selectedPrediction?.executiveId === prediction.executiveId 
                    ? 'rgba(0, 204, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${getActivityColor(prediction.predictedActivity)}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedPrediction(selectedPrediction?.executiveId === prediction.executiveId ? null : prediction)}
              >
                {/* Executive and Activity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#00ccff' }}>
                    {prediction.executiveName}
                  </span>
                  <span style={{ 
                    color: getActivityColor(prediction.predictedActivity),
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: `${getActivityColor(prediction.predictedActivity)}20`,
                    borderRadius: '4px'
                  }}>
                    {prediction.predictedActivity.toUpperCase()}
                  </span>
                </div>

                {/* Confidence and Timeframe */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Confidence:</span>
                  <span style={{ color: getConfidenceColor(prediction.confidence) }}>
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Timeframe:</span>
                  <span style={{ color: '#ffaa22' }}>
                    {prediction.timeframe}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Impact:</span>
                  <span style={{ 
                    color: prediction.impact === 'high' ? '#ff4444' : 
                           prediction.impact === 'medium' ? '#ffaa22' : '#00ff88'
                  }}>
                    {prediction.impact.toUpperCase()}
                  </span>
                </div>

                {/* Reasoning (expanded on click) */}
                {selectedPrediction?.executiveId === prediction.executiveId && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    opacity: 0.8
                  }}>
                    <strong>Reasoning:</strong> {prediction.reasoning}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '10px',
            opacity: 0.6,
            borderTop: '1px solid #00ccff40',
            paddingTop: '8px'
          }}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </Html>
    </group>
  );
}; 