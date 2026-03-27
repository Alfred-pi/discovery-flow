import { motion } from 'framer-motion';

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const progress = (current / total) * 100;

  return (
    <div className="progress-container">
      <motion.div
        className="progress-fill"
        initial={false}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    </div>
  );
}
