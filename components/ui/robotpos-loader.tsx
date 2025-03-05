import Image from "next/image";

export function RobotposLoader() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-background/80">
			<div className="relative h-[25vh] w-[25vh]">
				<Image
					src="/images/loading.gif"
					alt="Loading..."
                    fill // uses fill instead of width/height
                    style={{ objectFit: 'contain' }} // or 'cover
					priority
                    unoptimized 
				/>
			</div>
		</div>
	);
}
