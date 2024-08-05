"use client"

import { useState } from "react";
import {
    Dialog,
    DialogPanel,
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Popover,
    PopoverButton,
    PopoverGroup,
    PopoverPanel,
} from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    MusicalNoteIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { usePathname } from "next/navigation";
import Link from "next/link";

export const tools = [
    { name: '音乐', description: '高度自定义化放音乐的', href: '/nav/music', icon: MusicalNoteIcon },
    { name: '修改个人资料', description: '你就说这是不是个工具吧', href: '/nav/profiles', icon: UserCircleIcon },
];

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const path = usePathname();

    return (
        <header className="bg-[#16161a]">
            <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <Link href="#" className="-m-1.5 p-1.5">
                        <span className="sr-only">Jawbts</span>
                        <img alt="" src="https://cdn.jawbts.org/photos/logo.png" className="h-8 w-auto" />
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="h-6 w-6" />
                    </button>
                </div>
                <PopoverGroup className="hidden lg:flex lg:gap-x-12">
                    <Popover className="relative">
                        <PopoverButton className="flex items-center gap-x-1 text-lg font-semibold leading-6 text-[#f3f3f3]">
                            工具
                            <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                        </PopoverButton>

                        <PopoverPanel
                            transition
                            className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-[#343434] shadow-lg ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="p-4">
                                {tools.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group relative flex items-center gap-x-6 rounded-lg p-4 text-lg leading-6 hover:bg-[#494949]"
                                    >
                                        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-[#343434] hover:bg-[#494949]">
                                            <item.icon aria-hidden="true" className="h-6 w-6 text-gray-300 group-hover:text-gray-200" />
                                        </div>
                                        <div className="flex-auto">
                                            <Link href={path === item.href ? "#" : item.href} className="block font-semibold text-[#f3f3f3]">
                                                {item.name}
                                                <span className="absolute inset-0" />
                                            </Link>
                                            <p className="mt-1 text-gray-300">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>
                    <Link href={path === "/nav" ? "#" : "/nav"} className="text-lg font-semibold leading-6 text-[#f3f3f3]">
                        主页
                    </Link>
                    {/* 
                    <Link href="#" className="text-sm font-semibold leading-6 text-[#f3f3f3]">
                        Marketplace
                    </Link>
                    <Link href="#" className="text-sm font-semibold leading-6 text-[#f3f3f3]">
                        Company
                    </Link> */}
                </PopoverGroup>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    <Link href="/auth/logout" className="text-lg font-semibold leading-6 text-[#f3f3f3]">
                        登出 <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-10" />
                <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-[#16161a] px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                        <Link href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">Jawbts</span>
                            <img
                                alt=""
                                src="https://cdn.jawbts.org/photos/logo.png"
                                className="h-8 w-auto"
                            />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                <Disclosure as="div" className="-mx-3">
                                    <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-[#f3f3f3] hover:bg-[#494949]">
                                       工具
                                        <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none group-data-[open]:rotate-180" />
                                    </DisclosureButton>
                                    <DisclosurePanel className="mt-2 space-y-2">
                                        {tools.map((item) => (
                                            <DisclosureButton
                                                key={item.name}
                                                as="a"
                                                href={path === item.href ? "#" : item.href}
                                                className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-[#f3f3f3] hover:bg-[#494949]"
                                            >
                                                {item.name}
                                            </DisclosureButton>
                                        ))}
                                    </DisclosurePanel>
                                </Disclosure>
                                <Link
                                    href={path === "/nav" ? "#" : "/nav"}
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-[#f3f3f3] hover:bg-[#494949]"
                                >
                                    主页
                                </Link>
                                {/* 
                                <Link
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-[#f3f3f3] hover:bg-[#494949]"
                                >
                                    Marketplace
                                </Link>
                                <Link
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-[#f3f3f3] hover:bg-[#494949]"
                                >
                                    Company
                                </Link> */}
                            </div>
                            <div className="py-6">
                                <Link
                                    href="/auth/logout"
                                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-[#f3f3f3] hover:bg-[#494949]"
                                >
                                    登出
                                </Link>
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    );
}