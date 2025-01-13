import Link from "next/link";

export default function Page() {
    return (
        <div className="absolute m-auto inset-x-0 inset-y-0 w-1/2 h-1/2 text-gray-100 text-center text-xl">
            404 | Not Found <br /><br />
            <Link href="/" className="hover:text-white"> Click here to redirect to home page. </Link> <br />
            <Link href="/" className="hover:text-white"> 点这里以重定向到主页面. </Link>
        </div>
    );
}