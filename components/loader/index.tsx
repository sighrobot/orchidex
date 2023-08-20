import style from './style.module.scss';

const ANIMATION_DELAY_BASE_MS = 200;

export default function Loader({
  index = 1,
  height,
}: {
  index?: number;
  height: number;
}) {
  return (
    <div
      className={style.loader}
      style={{
        height: `${height}px`,
        animationDelay: `${index * ANIMATION_DELAY_BASE_MS}ms`,
      }}
    />
  );
}
