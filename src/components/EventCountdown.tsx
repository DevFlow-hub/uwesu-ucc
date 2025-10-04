import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface EventCountdownProps {
  eventDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const EventCountdown = ({ eventDate }: EventCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(eventDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  const isEventSoon = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${isEventSoon ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
      <Timer className={`h-4 w-4 ${isEventSoon ? 'text-primary' : 'text-muted-foreground'}`} />
      <div className="flex gap-4 text-sm font-mono">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{timeLeft.days}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">hrs</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">sec</span>
        </div>
      </div>
    </div>
  );
};

export default EventCountdown;
