import clsx from 'clsx';
import type { TopicCategory } from '@/types/event';
import { TOPIC_COLORS } from '@/types/event';

interface TopicBadgeProps {
  topic: TopicCategory;
  size?: 'sm' | 'md';
}

export default function TopicBadge({ topic, size = 'md' }: TopicBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        TOPIC_COLORS[topic],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {topic}
    </span>
  );
}
