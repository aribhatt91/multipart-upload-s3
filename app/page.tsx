import UploadWrapper from "@/components/UploadWrapper";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="min-h-screen w-full items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        
        <div className="w-full items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl text-center font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            A simple app to demonstrate multi-part file upload
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400"></p>
        </div>
        <div className="flex flex-col w-full text-base font-medium sm:flex-row">
          <UploadWrapper />
        </div>
      </main>
    </div>
  );
}
