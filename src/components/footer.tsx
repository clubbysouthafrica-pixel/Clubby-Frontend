import {Link} from "react-router-dom";

export default function Footer() {
    return (
        <footer className="rounded-lg shadow-sm m-4 bg-muted/30 align-bottom">
            <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                    © {new Date().getFullYear()} <a href="https://flowbite.com/" className="hover:underline">{import.meta.env.VITE_BRAND_NAME}™</a>. All Rights Reserved.
                </span>
                <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
                    <li>
                        <Link to="/about" className="hover:underline me-4 md:me-6">About</Link>
                    </li>
                    <li>
                        <Link to="/privacy" className="hover:underline me-4 md:me-6">Privacy Policy</Link>
                    </li>
                    <li>
                        <Link to="/license" className="hover:underline me-4 md:me-6">Licensing</Link>
                    </li>
                    <li>
                        <Link to="/contactus" className="hover:underline">Contact</Link>
                    </li>
                </ul>
            </div>
        </footer>

    )
}