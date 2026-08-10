import React from 'react'
import Lottie, { LottieComponentProps } from 'lottie-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PremiumLottieIconProps extends Omit<LottieComponentProps, 'animationData' | 'size'> {
  animationData: any; // The JSON imported from Lordicon or LottieFiles
  className?: string;
  size?: number | string;
  hoverMode?: boolean; // If true, only play on hover
}

export function PremiumLottieIcon({ 
  animationData, 
  className, 
  size = 24, 
  hoverMode = false,
  ...props 
}: PremiumLottieIconProps) {
  const lottieRef = React.useRef<any>(null)

  const handleMouseEnter = () => {
    if (hoverMode && lottieRef.current) {
      lottieRef.current.setDirection(1)
      lottieRef.current.play()
    }
  }

  const handleMouseLeave = () => {
    if (hoverMode && lottieRef.current) {
      lottieRef.current.setDirection(-1)
      lottieRef.current.play()
    }
  }

  return (
    <motion.div 
      className={cn("flex items-center justify-center cursor-pointer", className)}
      style={{ width: size, height: size }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={!hoverMode}
        loop={!hoverMode}
        style={{ width: '100%', height: '100%' }}
        {...props}
      />
    </motion.div>
  )
}
