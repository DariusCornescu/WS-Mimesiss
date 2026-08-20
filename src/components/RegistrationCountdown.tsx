'use client';

import { useEffect, useState } from 'react';
import { FaClock } from 'react-icons/fa';

interface RegistrationCountdownProps {
  startTime?: string | null; // ISO string - when registrations open
  deadline?: string | null; // ISO string - when registrations close
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type CountdownPhase = 'before-start' | 'open' | 'closed';

export default function RegistrationCountdown({ startTime, deadline }: RegistrationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [phase, setPhase] = useState<CountdownPhase>('closed');

  useEffect(() => {
    const calculateTimeLeft = (): { timeLeft: TimeLeft | null; phase: CountdownPhase } => {
      const now = Date.now();
      const startTimestamp = startTime ? new Date(startTime).getTime() : null;
      const deadlineTimestamp = deadline ? new Date(deadline).getTime() : null;

      // Before registration starts
      if (startTimestamp && now < startTimestamp) {
        const difference = startTimestamp - now;
        return {
          phase: 'before-start',
          timeLeft: {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          }
        };
      }

      // After deadline has passed
      if (deadlineTimestamp && now > deadlineTimestamp) {
        return { phase: 'closed', timeLeft: null };
      }

      // Registration is open - show countdown to deadline
      if (deadlineTimestamp && now < deadlineTimestamp) {
        const difference = deadlineTimestamp - now;
        return {
          phase: 'open',
          timeLeft: {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          }
        };
      }

      // No times set or registration is open indefinitely
      return { phase: 'open', timeLeft: null };
    };

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial.timeLeft);
    setPhase(initial.phase);

    // Update every second
    const timer = setInterval(() => {
      const result = calculateTimeLeft();
      setTimeLeft(result.timeLeft);
      setPhase(result.phase);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, deadline]);

  // Registration hasn't started yet
  if (phase === 'before-start' && timeLeft) {
    return (
      <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <FaClock className="h-6 w-6 mr-2 text-orange-500" />
          <h3 className="text-xl font-bold text-foreground">
            Înregistrările la workshop-uri se deschid în
          </h3>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-500">
              {timeLeft.days}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {timeLeft.days === 1 ? 'Zi' : 'Zile'}
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-500">
              {timeLeft.hours}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Ore
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-500">
              {timeLeft.minutes}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Minute
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-500">
              {timeLeft.seconds}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Secunde
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground text-center mt-4 text-sm">
          Conferințele rămân deschise pentru înregistrare în orice moment.
        </p>
      </div>
    );
  }

  // Registration is closed
  if (phase === 'closed') {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
        <FaClock className="h-8 w-8 mx-auto mb-3 text-destructive" />
        <h3 className="text-xl font-bold text-destructive mb-2">
          Înregistrările la workshop-uri s-au încheiat
        </h3>
        <p className="text-muted-foreground">
          Termenul limită pentru înregistrări la workshop-uri a expirat. Conferințele rămân deschise.
        </p>
      </div>
    );
  }

  // Registration is open - show deadline countdown if available
  if (phase === 'open' && timeLeft && deadline) {
    return (
      <div className="bg-primary/10 border border-primary rounded-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <FaClock className="h-6 w-6 mr-2 text-primary" />
          <h3 className="text-xl font-bold text-foreground">
            Timp rămas pentru înregistrări la workshop-uri
          </h3>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">
              {timeLeft.days}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {timeLeft.days === 1 ? 'Zi' : 'Zile'}
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">
              {timeLeft.hours}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Ore
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">
              {timeLeft.minutes}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Minute
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">
              {timeLeft.seconds}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Secunde
            </div>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Înregistrările la workshop-uri se închid pe {new Date(deadline).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          <br />
          <span className="text-xs">Conferințele rămân deschise pentru înregistrare</span>
        </p>
      </div>
    );
  }

  // Registration is open but no deadline set
  return null;
}
