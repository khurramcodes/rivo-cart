import Link from "next/link";

const Copyright = () => {
  return (
    <div className='text-zinc-900 text-center border-t border-zinc-200 py-4 px-2 bg-white'>
      Copyright © {new Date().getFullYear()}{" "}
      <Link href='/' className='text-primary'>
        Mishal Organics
      </Link>
      . All rights reserved.
    </div>
  );
};

export default Copyright;
