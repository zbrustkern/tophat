import Image from 'next/image';

export default function TophatLogo() {
    return (
        <div className="text-orange-300">
        <img src="/tophat_logo.png"
                    width={175}
                    height={355}
                    className=""
                  alt="Tophat logo" />
                  <strong className='ml-5'>Tophat Financial</strong>
      </div>
    )
}