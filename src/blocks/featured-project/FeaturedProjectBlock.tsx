import { useRef } from "react";
import type { BlockProps } from "../types";
import type { FeaturedProjectBlockData } from "./types";
import AnimatedContent from "@/components/ui/AnimatedContent";
import GradientHeading from "@/components/shared/GradientHeading";
import { useParallax } from "@/hooks/useParallax";

export function FeaturedProjectBlockComponent({
  data,
  theme,
}: BlockProps<FeaturedProjectBlockData>) {
  const d = data;
  const isDark = theme.mode === "dark";

  // 项目大图视差
  const visualRef = useRef<HTMLDivElement>(null);
  useParallax(visualRef, { speed: 0.2 });

  return (
    <section id="featured" className="py-24 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <GradientHeading>{d.heading || "深度案例"}</GradientHeading>
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mt-16">
          <AnimatedContent
            direction="horizontal"
            distance={-60}
            delay={200}
            className="lg:w-3/5"
          >
            <div
              ref={visualRef}
              className="mx-auto max-w-2xl aspect-[4/3] rounded-2xl bg-gradient-to-br from-warm-500/30 via-accent-pink-500/20 to-violet-500/30 flex items-center justify-center relative overflow-hidden"
            >
              <div className="text-center relative z-10">
                <div className="text-8xl mb-6">{d.project.icon || "🚀"}</div>
                <p
                  className={`text-3xl font-bold px-6 font-display ${isDark ? "text-white/60" : "text-stone-700/60"}`}
                >
                  {d.project.title}
                </p>
              </div>
            </div>
          </AnimatedContent>
          <AnimatedContent
            direction="horizontal"
            distance={60}
            delay={400}
            className="lg:w-2/5"
          >
            <span className="text-warm-500 text-sm uppercase tracking-widest font-medium">
              Featured Project
            </span>
            <h3
              className={`text-2xl sm:text-3xl font-bold mt-3 mb-4 ${theme.textColor}`}
            >
              {d.project.title}
            </h3>
            <p
              className={`leading-relaxed mb-6 ${isDark ? "text-stone-400" : "text-stone-500"}`}
            >
              {d.project.desc}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {d.project.tags.map((tag, ti) => (
                <span
                  key={tag}
                  className={`px-3 py-1 rounded-full text-sm ${
                    ti % 2 === 0
                      ? "bg-warm-500/15 text-warm-400"
                      : "bg-accent-pink-500/15 text-accent-pink-400"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
