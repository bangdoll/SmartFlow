import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react'; // Assuming Sparkles is imported from lucide-react based on the new code

export function Header() {
    return (
        <Link href="/#subscribe" className="hidden md:inline-flex bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
            訂閱電子報
        </Link>
                    </div >
                </nav >
            </div >
        </header >
    );
}
