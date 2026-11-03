// Short examples taken from AI_Human_cleaned.csv, with the dataset's own `generated` label.
// They come from the training data, so the model is expected to be confident on them.
export const SAMPLES = [
  {
    id: "human",
    name: "Dataset sample: labelled human",
    text: `People should not be able to use cell phone while they are driving in any capacity. The reasons they should not be allowed to use them is because they could seriously hurt someone or kill them when they are using their cell phones. When you are using a cell phone while operating a vehicle you are paying attention to the phone rather than the road.

Let's say you were using your phone and you hit somebody and killed them what would you do. You would probably drive off and then call the police but if you did do that then they would check traffic cameras and the get your license plate and you would go to jail for a hit and run charge. But if you stay then you're going to either get a ticket for distracted driving or you could go to jail on a manslaughter charge so its up to you on what you do.`,
  },
  {
    id: "ai",
    name: "Dataset sample: labelled AI",
    text: `I mean, yeah, talking to multiple people for advice can definitely help. I guess it's because when you hear different perspectives and ideas, you get a more balanced view on the situation. Plus, everyone has different experiences and knowledge, so they might bring up something you hadn't even thought about. Like, let's say you're trying to decide which college to go to. If you only ask one person, they might just tell you to go to their alma mater because they had a good time there. But if you ask a few people, you'll hear about different schools and what they liked or didn't like about them. Then you can weigh all those factors and make a more informed decision.`,
  },
];
