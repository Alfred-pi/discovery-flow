import { motion } from 'framer-motion';

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const progress = (current / total) * 100;

  return (
    <div className="progress-bar-container">
      <motion.div
        className="progress-bar-fill"
        initial={false}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}
