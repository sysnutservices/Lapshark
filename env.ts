export const RAZORPAY_KEY = "rzp_test_RmHbBlaw4870PQ"
export interface Review {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    date: string;
    comment: string;
    verified: boolean;
}
export const REVIEWS: Review[] = [
    { id: 'r1', productId: '1', userName: 'Amit Patel', rating: 5, date: '2023-10-15', comment: 'Absolutely loves the X1 Carbon. Keyboard is legendary as expected. Battery life is solid 8 hours.', verified: true },
    { id: 'r2', productId: '1', userName: 'Sarah Jenkins', rating: 4, date: '2023-11-02', comment: 'Great laptop, very light. Came with a minor scratch on the lid but screen is perfect.', verified: true },
    { id: 'r3', productId: '2', userName: 'Rahul Gupta', rating: 5, date: '2023-09-20', comment: 'The OLED screen on this Dell XPS is stunning. Creating content is a joy.', verified: true },
    { id: 'r4', productId: '3', userName: 'Mike Ross', rating: 5, date: '2023-12-05', comment: 'Beast of a machine. Compile times are non-existent now. Worth every penny.', verified: true },
    { id: 'r5', productId: '4', userName: 'Gam3r_Bo1', rating: 4, date: '2023-10-30', comment: 'Runs Cyberpunk 2077 on Ultra settings easily. Fans get a bit loud though.', verified: true },
    { id: 'r6', productId: '5', userName: 'John Doe', rating: 5, date: '2023-11-12', comment: 'Great value for money. Looks brand new.', verified: true },
    { id: 'r7', productId: '6', userName: 'Jane Smith', rating: 4, date: '2023-12-01', comment: 'Small form factor is amazing. Battery life could be better.', verified: true },
    { id: 'r8', productId: '7', userName: 'Alex Johnson', rating: 5, date: '2023-11-25', comment: 'Perfect for college. Light and fast.', verified: true },
    { id: 'r9', productId: '8', userName: 'Emily Davis', rating: 4, date: '2023-10-05', comment: 'Solid build quality. Screen is bright.', verified: true },
    { id: 'r10', productId: '9', userName: 'Chris Wilson', rating: 5, date: '2023-12-10', comment: 'Love the 15 inch screen. M2 is super fast.', verified: true },
    { id: 'r11', productId: '10', userName: 'David Brown', rating: 5, date: '2023-11-15', comment: 'Absolute beast. RGB lighting is cool.', verified: true },
    { id: 'r12', productId: '11', userName: 'Lisa Miller', rating: 4, date: '2023-10-20', comment: 'Very light for a 17 inch laptop. Screen is beautiful.', verified: true },
    { id: 'r13', productId: '12', userName: 'Mark Taylor', rating: 5, date: '2023-12-05', comment: 'Great for CAD work. Fast and reliable.', verified: true },
    { id: 'r14', productId: 'acc-1', userName: 'Paul Walker', rating: 5, date: '2023-11-01', comment: 'Best mouse I have ever used. Ergonomics are top notch.', verified: true },
];