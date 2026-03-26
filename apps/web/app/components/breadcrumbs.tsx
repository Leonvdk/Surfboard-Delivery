import Link from "next/link";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	return (
		<nav className="blog-breadcrumbs" aria-label="Breadcrumb">
			{items.map((item, i) => {
				const isLast = i === items.length - 1;
				return (
					<span key={item.label}>
						{i > 0 && <span>/</span>}
						{isLast || !item.href ? (
							<span>{item.label}</span>
						) : (
							<Link href={item.href}>{item.label}</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}
