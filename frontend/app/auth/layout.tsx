"use client";

import { Mail, Star } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const testimonials = {
	login: {
		quote:
			"We've been using TZW to kick start our management and inspection procedures",
		name: "Pippa Wilkinson",
		role: "Fire Department Officer",
		accent: "bg-violet-600",
		avatarSrc:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80",
		showStarsAbove: false,
	},
	register: {
		quote:
			"TZW has saved us thousands of hours of work. We're able to manage things much faster.",
		name: "Lori Bryson",
		role: "Product Designer, Sisyphus",
		accent: "bg-emerald-500",
		avatarSrc:
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&h=160&q=80",
		showStarsAbove: true,
	},
};

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	const { isAuthenticated, isLoading, user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const mode = pathname.includes("/register") ? "register" : "login";
	const testimonial = testimonials[mode];

	// Signed-in users have no business on the auth screens, but let unverified
	// users reach the verify-email step.
	useEffect(() => {
		if (!isLoading && isAuthenticated && user?.emailVerified) {
			router.replace("/dashboard");
		}
	}, [isLoading, isAuthenticated, user?.emailVerified, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<Spinner className="size-5 text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="grid min-h-svh bg-white text-slate-950 lg:grid-cols-2">
			<aside className="relative hidden min-h-svh flex-col overflow-hidden bg-slate-50 px-8 py-9 lg:flex">
				<Brand iconOnly className="absolute left-8 top-8" />

				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xl text-center">
						{testimonial.showStarsAbove && <Stars className="mb-9" />}
						<h2 className="text-balance font-semibold text-[32px] leading-[1.17] tracking-normal text-slate-950">
							{testimonial.quote}
						</h2>
						<div className="mt-9 flex flex-col items-center">
							<div className="relative size-16 overflow-visible rounded-full shadow-sm">
								<Image
									src={testimonial.avatarSrc}
									alt={testimonial.name}
									width={64}
									height={64}
									className="size-16 rounded-full object-cover"
									priority
								/>
								<span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-slate-50 bg-white">
									<span
										className={cn("size-3 rounded-full", testimonial.accent)}
									/>
								</span>
							</div>
							<p className="mt-4 font-semibold text-base text-slate-950">
								{testimonial.name}
							</p>
							<p className="mt-1 text-slate-600 text-sm">{testimonial.role}</p>
							{!testimonial.showStarsAbove && <Stars className="mt-8" />}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between text-slate-600 text-sm">
					<span>&copy; TZW Fire Safety</span>
					{mode === "register" && (
						<a
							href="mailto:help@tzw.test"
							className="inline-flex items-center gap-2 hover:text-slate-950"
						>
							<Mail className="size-4" />
							help@tzw.test
						</a>
					)}
				</div>
			</aside>

			<section className="flex min-h-svh flex-col px-6 py-8 sm:px-10 lg:px-20">
				<div className="lg:hidden">
					<Brand />
				</div>
				<main className="flex flex-1 items-center justify-center py-12">
					<div className="w-full max-w-90">{children}</div>
				</main>
				<p className="text-center text-slate-500 text-sm lg:hidden">
					&copy; TZW Fire Safety
				</p>
			</section>
		</div>
	);
}

function Stars({ className }: { className?: string }): React.ReactElement {
	return (
		<div
			aria-label="5 star rating"
			className={cn("flex justify-center gap-1.5 text-amber-400", className)}
		>
			{Array.from({ length: 5 }).map((_, index) => (
				<Star
					// biome-ignore lint/suspicious/noArrayIndexKey: The five stars are static.
					key={index}
					className="size-5 fill-current stroke-current"
				/>
			))}
		</div>
	);
}
