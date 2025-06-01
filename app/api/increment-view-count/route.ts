import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = body.postId;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required in the request body' }, { status: 400 });
    }

    // Step 1: Fetch the current viewcnt
    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("viewcnt")
      .eq("id", postId)
      .single();

    if (fetchError) {
      console.error("Error fetching viewcnt for postId", postId, ":", fetchError);
      if (fetchError.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch view count', details: fetchError.message }, { status: 500 });
    }

    // Step 2: Calculate the new viewcnt value (default to 0 if it's null)
    const currentViewcnt = data?.viewcnt ?? 0;
    const newViewcnt = currentViewcnt + 1;

    // Step 3: Update the viewcnt in the database
    const { error: updateError } = await supabase
      .from("posts")
      .update({ viewcnt: newViewcnt })
      .eq("id", postId);

    if (updateError) {
      console.error("Error updating viewcnt for postId", postId, ":", updateError);
      return NextResponse.json({ error: 'Failed to update view count', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'View count updated successfully', newViewcnt }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to increment view count (general catch):", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to increment view count', details: error.message || 'Unknown error' }, { status: 500 });
  }
}
