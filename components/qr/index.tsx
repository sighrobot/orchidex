import { QRCodeCanvas } from 'qrcode.react';

export default function QR({ value }: { value: string }) {
  return (
    <QRCodeCanvas
      value={value}
      level='Q'
      imageSettings={{
        src: 'https://freight.cargo.site/w/900/q/75/i/9a795c2659b3990f715a552b079b7d9e8e650b178ee6a476ef0a3a49d07681b2/Screenshot-2024-06-19-at-6.29.46PM.png',
        width: 85,
        height: 20,
        excavate: false,
      }}
      bgColor='transparent'
      fgColor='fuchsia'
    />
  );
}
