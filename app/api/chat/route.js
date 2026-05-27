import { NextResponse } from 'next/server';
import { generate } from '../../../lib/chatbot';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, threadId } = body;

    if (!message || !threadId) {
      return NextResponse.json(
        { message: 'All fields are required!' },
        { status: 400 }
      );
    }

    console.log('Message:', message);

    const result = await generate(message, threadId);
    return NextResponse.json({ message: result });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
