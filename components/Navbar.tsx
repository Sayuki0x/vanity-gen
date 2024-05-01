import Link from "next/link";
import { Home } from "react-feather";

export function Navbar() {
    return (
        <div className="w-full py-5 px-5 z-10">
            <div className="flex items-end font-bold items-center gap-6">
                <Link
                    className="flex items-center gap-2 hover:opacity-90"
                    href="/"
                >
                    <span>VanityGen</span>
                </Link>

                <div className="ml-auto">
                    <div className="flex gap-3"></div>
                </div>
            </div>
        </div>
    );
}
