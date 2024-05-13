import View from '@/components/canvas/View'

export default function Home() {
  return (
    <>
      <section className='flex flex-col gap-6'>
        <hgroup className='text-center'>
          <h2>DESIGN</h2>
          <p>A Human Journey</p>
        </hgroup>

        <div className='flex flex-row gap-6'>
          <div className='flex w-1/2 flex-col gap-3'>
            <hgroup>
              <h3>TBD</h3>
              <p>THE UNIVERSE</p>
            </hgroup>
            <p>
              At the core of meaningful design lies a profound understanding of one's identity and mission. It's vital
              for your audience to not just see, but to deeply feel and connect with the essence of the message you
              embody.
            </p>
          </div>
          <View className='w-1/2'>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial />
            </mesh>
            <ambientLight intensity={0.2} />
          </View>
        </div>

        <div className='flex flex-row gap-6'>
          <div className='flex w-1/2 flex-col gap-3'>
            <hgroup>
              <h3>TBD</h3>
              <p>THE SYMBIOSIS</p>
            </hgroup>
            <p>
              From narrative flow to visual harmony, every aspect of design is steeped in empathy. My commitment is to
              craft designs that captivate and resonate, fostering a genuine connection that upholds transparency and
              trust.
            </p>
          </div>
          <View className='w-1/2'>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial />
            </mesh>
            <ambientLight intensity={0.2} />
          </View>
        </div>

        <div className='flex flex-row gap-6'>
          <div className='flex w-1/2 flex-col gap-3'>
            <hgroup>
              <h3>TBD</h3>
              <p>THE PASSION</p>
            </hgroup>
            <p>
              Leveraging a subtle yet distinct touch of unconventionality, I infuse a unique flair that sets you apart.
              Your presence will capture attention and leave an enduring impression, making them truly unforgettable.
            </p>
          </div>
          <View className='w-1/2'>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial />
            </mesh>
            <ambientLight intensity={0.2} />
          </View>
        </div>
      </section>

      <section className='flex flex-col gap-6'>
        <hgroup className='text-center'>
          <h2>DEVELOPMENT</h2>
          <p>An Immersive Gateway</p>
        </hgroup>

        <div className='flex flex-row gap-6'>
          <div className='flex w-1/2 flex-col gap-3'>
            <hgroup>
              <h3>TBD</h3>
              <p>THE ENGINE</p>
            </hgroup>
            <p>
              Crafting a resilient structure is vital for future readiness. I meld industry and web standards with the
              latest technologies, ensuring your digital foundation is both robust and adaptable, ready to evolve with
              the digital era.
            </p>
          </div>
          <View className='w-1/2'>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial />
            </mesh>
            <ambientLight intensity={0.2} />
          </View>
        </div>

        <div className='flex flex-row gap-6'>
          <div className='flex w-1/2 flex-col gap-3'>
            <hgroup>
              <h3>TBD</h3>
              <p>THE DYNAMICS</p>
            </hgroup>
            <p>
              In the digital realm, motion and 3D elements breathe life into every page. I leverage these techniques to
              weave stories, evoke emotions, and add depth, transforming your digital presence into an engaging journey
              for every user.
            </p>
          </div>
          <View className='w-1/2'>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial />
            </mesh>
            <ambientLight intensity={0.2} />
          </View>
        </div>

        <div className='flex flex-row gap-6'>
          <div className='flex w-1/2 flex-col gap-3'>
            <hgroup>
              <h3>TBD</h3>
              <p>THE OPENNESS</p>
            </hgroup>
            <p>
              Accessibility and usability are the cornerstones of an inclusive web. Through careful crafting, I
              emphasize clarity and ease, building intuitive experiences that welcome and connect users (from all walks
              of life.) (alien icon/emoji? space invader?)
            </p>
          </div>
          <View className='w-1/2'>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial />
            </mesh>
            <ambientLight intensity={0.2} />
          </View>
        </div>
      </section>
    </>
  )
}
