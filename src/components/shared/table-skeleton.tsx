import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-50 last:border-0">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="p-6">
              <div className="h-5 bg-slate-100 rounded-lg w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
