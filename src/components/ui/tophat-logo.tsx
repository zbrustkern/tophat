import Image from 'next/image';

export default function TophatLogo() {
    return (
        <div className="flex flex-col text-orange-300 items-center">
        <img src="/tophat_logo.png"
                    width={160}
                    height={160}
                    className=""
                  alt="Tophat logo" />
                  <strong>Tophat Financial</strong>
      </div>
    )
}