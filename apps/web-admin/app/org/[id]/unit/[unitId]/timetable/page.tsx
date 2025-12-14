import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useParams } from 'next/navigation';
// import { Plus } from 'lucide-react';
// import { Button } from '@workspace/ui/components/button';
// import { Card, CardContent } from '@workspace/ui/components/card';
// import { Badge } from '@workspace/ui/components/badge';
// import { AppDispatch, RootState } from '@/store/store';
// import {
//   TimetableEntry,
//   fetchAudienceTimetable,
//   selectAudienceTimetableEntries,
//   selectAudienceTimetableStatus,
//   selectAudienceTimetableError,
// } from '@workspace/state';

// const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// export default function AudienceTimetablePage() {
//   const { id: orgId, audienceId } = useParams() as {
//     id: string;
//     audienceId: string;
//   };
//   const dispatch = useDispatch<AppDispatch>();
//   const entries = useSelector((s: RootState) =>
//     selectAudienceTimetableEntries(s, audienceId)
//   );
//   const status = useSelector(selectAudienceTimetableStatus);
//   const error = useSelector(selectAudienceTimetableError);

//   const [view, setView] = useState<'list' | 'editor'>('list');

//   useEffect(() => {
//     if (orgId && audienceId) {
//       dispatch(fetchAudienceTimetable({ orgId, audienceId }));
//     }
//   }, [dispatch, orgId, audienceId]);

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Timetable</h1>
//           <p className="text-sm text-muted-foreground">
//             Weekly schedule for this audience
//           </p>
//         </div>

//         {view === 'editor' ? (
//           <Button variant="outline" onClick={() => setView('list')}>
//             Back to list
//           </Button>
//         ) : (
//           <Button onClick={() => setView('editor')}>Edit timetable</Button>
//         )}
//       </div>

//       {/* Content */}
//       {view === 'list' ? (
//         <TimetableList
//           entries={entries}
//           loading={status === 'loading'}
//           error={error}
//           onOpen={() => setView('editor')}
//         />
//       ) : (
//         <TimetableEditor entries={entries} loading={status === 'loading'} />
//       )}

//       <p className="text-xs text-muted-foreground">
//         Timetable applies to all students in this audience. Attendance will be
//         created from these slots.
//       </p>
//     </div>
//   );
// }

// function TimetableList({
//   entries,
//   loading,
//   error,
//   onOpen,
// }: {
//   entries: TimetableEntry[];
//   loading: boolean;
//   error: string | null;
//   onOpen: () => void;
// }) {
//   if (loading) {
//     return (
//       <Card>
//         <CardContent className="p-6 text-sm text-muted-foreground">
//           Loading timetable...
//         </CardContent>
//       </Card>
//     );
//   }

//   if (error) {
//     return (
//       <Card>
//         <CardContent className="p-6 text-sm text-destructive">
//           Failed to load timetable: {error}
//         </CardContent>
//       </Card>
//     );
//   }

//   if (!entries.length) {
//     return (
//       <Card>
//         <CardContent className="p-6 text-center space-y-3">
//           <p className="text-sm text-muted-foreground">
//             No timetable slots created yet.
//           </p>
//           <Button onClick={onOpen}>Create timetable</Button>
//         </CardContent>
//       </Card>
//     );
//   }

//   const preview = [...entries].slice(0, 5);

//   return (
//     <Card>
//       <CardContent className="p-6 space-y-4">
//         <div className="flex items-center justify-between">
//           <div className="font-medium">Current timetable</div>
//           <Button onClick={onOpen}>Open editor</Button>
//         </div>

//         <div className="space-y-2">
//           {preview.map((e) => (
//             <div
//               key={e.id}
//               className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
//             >
//               <div>
//                 <div className="font-medium">{e.subject?.name || '-'}</div>
//                 <div className="text-xs text-muted-foreground">
//                   {e.startTime} - {e.endTime}
//                 </div>
//               </div>

//               <Badge variant="secondary">{DAYS[e.dayOfWeek] ?? 'Day'}</Badge>
//             </div>
//           ))}
//         </div>

//         {entries.length > preview.length && (
//           <p className="text-xs text-muted-foreground">
//             + {entries.length - preview.length} more slots
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// function TimetableEditor({
//   entries,
//   loading,
// }: {
//   entries: TimetableEntry[];
//   loading: boolean;
// }) {
//   const timeRanges = useMemo(() => {
//     const ranges = new Set<string>();
//     entries.forEach((e) => {
//       ranges.add(`${e.startTime}-${e.endTime}`);
//     });
//     if (!ranges.size) {
//       ['09:00-10:00', '10:00-11:00', '11:00-12:00'].forEach((r) =>
//         ranges.add(r)
//       );
//     }
//     return Array.from(ranges).sort((a, b) => a.localeCompare(b));
//   }, [entries]);

//   const slotsByDayAndRange = useMemo(() => {
//     const map = new Map<string, TimetableEntry[]>();
//     entries.forEach((entry) => {
//       const key = `${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}`;
//       if (!map.has(key)) map.set(key, []);
//       map.get(key)!.push(entry);
//     });
//     return map;
//   }, [entries]);

//   return (
//     <Card className="overflow-x-auto">
//       <div className="min-w-[1000px] p-4 space-y-2">
//         <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
//           <div />
//           {DAYS.map((d) => (
//             <div key={d} className="p-2 font-medium text-sm">
//               {d}
//             </div>
//           ))}
//         </div>

//         {timeRanges.map((slot) => (
//           <div
//             key={slot}
//             className="grid grid-cols-[100px_repeat(7,1fr)] border-b last:border-b-0"
//           >
//             <div className="p-2 text-xs text-muted-foreground">{slot}</div>

//             {DAYS.map((_, dayIndex) => {
//               const matches =
//                 slotsByDayAndRange.get(`${dayIndex}-${slot}`) ?? [];

//               return (
//                 <div
//                   key={`${dayIndex}-${slot}`}
//                   className="p-2 hover:bg-muted/40 cursor-pointer"
//                 >
//                   {matches.length ? (
//                     matches.map((match) => (
//                       <div
//                         key={match.id}
//                         className="rounded-md bg-primary/10 p-2 text-xs space-y-0.5"
//                       >
//                         <div className="font-medium">
//                           {match.subject?.name || '-'}
//                         </div>
//                         <div className="text-muted-foreground">
//                           {match.teacher?.name || '-'}
//                         </div>
//                         {(match.room || match.mode) && (
//                           <div className="text-[11px] text-muted-foreground">
//                             {[match.room, match.mode]
//                               .filter(Boolean)
//                               .join(' | ')}
//                           </div>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="flex h-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
//                       <Plus className="mr-1 h-3 w-3" />
//                       {loading ? 'Loading...' : 'Add'}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         ))}
//       </div>
//     </Card>
//   );
// }
