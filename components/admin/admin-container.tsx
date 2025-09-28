// import { usePaginatedQuery } from "convex/react"
// import { api } from "@/convex/_generated/api"

import {  DataTableDemo } from "./users/data-table";

// export function AdminContainer() {
//     const { results, status, loadMore } = usePaginatedQuery(
//         api.users.getAll, 
//         {},
//         { initialNumItems: 1 }
//     );

//     return (
//         <div className="p-4">
//             {results?.map(({ _id, name, email, plan }) => <div key={_id}>{name} {email} {plan}</div>)}
//             <button onClick={() => loadMore(5)} disabled={status !== "CanLoadMore"}>
//                 Load More
//             </button>
//         </div>
//     )
// }

export function AdminContainer() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <DataTableDemo />
        </div>
    )
}